import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { GraduationCap, LogOut, Plus, Share2, Eye, Loader2, Download, Edit, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const testSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  subject: z.string().min(1, "Subject is required"),
  classLevel: z.number().min(6).max(10),
  difficulty: z.enum(["easy", "medium", "hard"]),
  topic1: z.string().min(3, "Topic 1 is required (minimum 3 characters)"),
  topic2: z.string().optional(),
  topic3: z.string().optional(),
  topic4: z.string().optional(),
  numQuestions: z.number().min(5).max(50),
  testType: z.enum(["mcq", "open-ended", "mixed"]),
  gptModel: z.enum(["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"]),
  instructions: z.string().optional(),
});

type TestForm = z.infer<typeof testSchema>;

interface TeacherDashboardProps {
  teacherData: any;
  onLogout: () => void;
}

const SUBJECTS = [
  { value: "Physics", label: "Physics" },
  { value: "Chemistry", label: "Chemistry" },
  { value: "Biology", label: "Biology" },
  { value: "Hindi", label: "Hindi" },
  { value: "Marathi", label: "Marathi" },
  { value: "Kannada", label: "Kannada" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Spanish", label: "Spanish" },
  { value: "General", label: "General Science" },
];

export default function TeacherDashboard({ teacherData, onLogout }: TeacherDashboardProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [showQuestionsDialog, setShowQuestionsDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [showManualEditDialog, setShowManualEditDialog] = useState(false);
  const [showAIEditDialog, setShowAIEditDialog] = useState(false);
  const [aiEditFeedback, setAIEditFeedback] = useState("");
  const { toast } = useToast();

  const form = useForm<TestForm>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      title: "",
      subject: "",
      classLevel: 7,
      difficulty: "medium",
      topic1: "",
      topic2: "",
      topic3: "",
      topic4: "",
      numQuestions: 10,
      testType: "mcq",
      gptModel: "gpt-4o-mini",
      instructions: "",
    },
  });

  const { data: tests = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/teacher/${teacherData.id}/tests`],
  });

  const { data: testDetails } = useQuery<any>({
    queryKey: [`/api/teacher/${teacherData.id}/tests/${selectedTestId}`],
    enabled: !!selectedTestId,
  });

  const generateMutation = useMutation({
    mutationFn: async (data: TestForm) => {
      // Combine topics into comma-separated syllabus
      const topics = [data.topic1, data.topic2, data.topic3, data.topic4]
        .filter(topic => topic && topic.trim().length > 0)
        .join(', ');
      
      const payload = {
        title: data.title,
        subject: data.subject,
        classLevel: data.classLevel,
        difficulty: data.difficulty,
        syllabus: topics, // Send combined topics as syllabus
        numQuestions: data.numQuestions,
        testType: data.testType,
        gptModel: data.gptModel,
        instructions: data.instructions,
      };
      
      const res = await apiRequest("POST", `/api/teacher/${teacherData.id}/generate-test`, payload);
      return await res.json();
    },
    onSuccess: (result: any) => {
      toast({
        title: "Test Generated!",
        description: `Successfully created ${result.questionsGenerated} questions. Share code: ${result.test.shareCode}`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/${teacherData.id}/tests`] });
      form.reset();
      setShowForm(false);
      // Show the questions dialog
      setSelectedTestId(result.test.id);
      setShowQuestionsDialog(true);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error.message || "Could not generate test",
      });
    },
  });

  const manualEditMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/teacher/${teacherData.id}/question/${data.questionId}/edit`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Question Updated!",
        description: "Your changes have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/${teacherData.id}/tests/${selectedTestId}`] });
      setShowManualEditDialog(false);
      setEditingQuestion(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Could not update question",
      });
    },
  });

  const aiEditMutation = useMutation({
    mutationFn: async (data: { questionId: string; feedback: string }) => {
      const res = await apiRequest("POST", `/api/teacher/${teacherData.id}/question/${data.questionId}/ai-edit`, { feedback: data.feedback });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Question Improved!",
        description: "AI has successfully updated the question based on your feedback.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/${teacherData.id}/tests/${selectedTestId}`] });
      setShowAIEditDialog(false);
      setEditingQuestion(null);
      setAIEditFeedback("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "AI Edit failed",
        description: error.message || "Could not improve question with AI",
      });
    },
  });

  function handleSubmit(data: TestForm) {
    generateMutation.mutate(data);
  }

  function copyShareCode(shareCode: string) {
    navigator.clipboard.writeText(shareCode);
    toast({
      title: "Copied!",
      description: "Share code copied to clipboard",
    });
  }

  async function downloadQuestionPaper(testId: string) {
    try {
      // Fetch test details if not already loaded
      const response = await fetch(`/api/teacher/${teacherData.id}/tests/${testId}`);
      const data = await response.json();
      
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(data.test.title, 14, 20);
      
      // Add test details
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Subject: ${data.test.subject}`, 14, 30);
      doc.text(`Class: ${data.test.classLevel}`, 14, 36);
      doc.text(`Difficulty: ${data.test.difficulty}`, 14, 42);
      doc.text(`Total Questions: ${data.questions.length}`, 14, 48);
      doc.text(`Share Code: ${data.test.shareCode}`, 14, 54);
      
      // Add instructions if available
      if (data.test.instructions) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Instructions:", 14, 62);
        doc.setFont("helvetica", "normal");
        const instructionLines = doc.splitTextToSize(data.test.instructions, 180);
        doc.text(instructionLines, 14, 68);
      }
      
      // Add questions
      let yPos = data.test.instructions ? 80 : 64;
      data.questions.forEach((question: any, index: number) => {
        // Check if we need a new page
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        
        // Question number and text
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`Question ${index + 1}:`, 14, yPos);
        
        doc.setFont("helvetica", "normal");
        const questionLines = doc.splitTextToSize(question.question, 180);
        doc.text(questionLines, 14, yPos + 6);
        yPos += 6 + (questionLines.length * 5);
        
        // Options for MCQ
        if (question.questionType === "mcq" && question.options) {
          doc.setFontSize(11);
          question.options.forEach((option: string, optIdx: number) => {
            if (yPos > 260) {
              doc.addPage();
              yPos = 20;
            }
            const optionText = `${String.fromCharCode(65 + optIdx)}. ${option}`;
            const optionLines = doc.splitTextToSize(optionText, 170);
            doc.text(optionLines, 20, yPos);
            yPos += optionLines.length * 5;
          });
        }
        
        yPos += 8; // Space between questions
      });
      
      // Save the PDF
      doc.save(`${data.test.title}_${data.test.shareCode}.pdf`);
      
      toast({
        title: "Downloaded",
        description: "Question paper downloaded successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download question paper",
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome, {teacherData.fullName}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={onLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {!showForm ? (
          <div className="mb-8">
            <Button 
              onClick={() => setShowForm(true)} 
              size="lg"
              data-testid="button-create-test"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New Test
            </Button>
          </div>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create Custom MCQ Test</CardTitle>
              <CardDescription>
                Configure test parameters and AI will generate questions automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Title</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Chapter 5 Physics Test" 
                              {...field}
                              data-testid="input-title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-subject">
                                <SelectValue placeholder="Select subject" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SUBJECTS.map((subject) => (
                                <SelectItem key={subject.value} value={subject.value}>
                                  {subject.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="classLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class Standard</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            value={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-class">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[6, 7, 8, 9, 10].map((cls) => (
                                <SelectItem key={cls} value={cls.toString()}>
                                  Class {cls}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty Level</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-difficulty">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numQuestions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Questions (5-50)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={5} 
                              max={50}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-num-questions"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="testType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-test-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="mcq">MCQ Only</SelectItem>
                              <SelectItem value="open-ended">Open-Ended Only</SelectItem>
                              <SelectItem value="mixed">Mixed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gptModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GPT Model</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-gpt-model">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="gpt-4o-mini">
                                GPT-4o Mini (Fast & Affordable) ⚡
                              </SelectItem>
                              <SelectItem value="gpt-4o">
                                GPT-4o (Best Quality) ⭐
                              </SelectItem>
                              <SelectItem value="gpt-3.5-turbo">
                                GPT-3.5 Turbo (Cheapest) 💰
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-3">
                    <FormLabel className="text-base">Syllabus/Topics</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Enter up to 4 topics. Questions will be distributed evenly across all topics you provide.
                    </p>
                    
                    <div className="grid gap-3">
                      <FormField
                        control={form.control}
                        name="topic1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Topic 1 (Required)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Force and Motion" 
                                {...field}
                                data-testid="input-topic1"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="topic2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Topic 2 (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Photosynthesis" 
                                {...field}
                                data-testid="input-topic2"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="topic3"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Topic 3 (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., French Verbs" 
                                {...field}
                                data-testid="input-topic3"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="topic4"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Topic 4 (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Cell Structure" 
                                {...field}
                                data-testid="input-topic4"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instructions (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add any special instructions for students..." 
                            {...field}
                            data-testid="textarea-instructions"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={generateMutation.isPending}
                      data-testid="button-generate"
                    >
                      {generateMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate Test"
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowForm(false)}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-4">Your Tests</h2>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No tests created yet. Click "Create New Test" to get started!
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {tests.map((test: any) => (
                <Card key={test.id} data-testid={`test-card-${test.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{test.title}</CardTitle>
                        <CardDescription>
                          {test.subject} • Class {test.classLevel} • {test.difficulty}
                        </CardDescription>
                      </div>
                      <Badge variant={test.status === "published" ? "default" : "secondary"}>
                        {test.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Topic: {test.syllabus} • {test.numQuestions} questions
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="px-3 py-1 bg-muted rounded text-sm font-mono">
                          {test.shareCode}
                        </code>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedTestId(test.id);
                            setShowQuestionsDialog(true);
                          }}
                          data-testid={`button-view-${test.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Questions
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => downloadQuestionPaper(test.id)}
                          data-testid={`button-download-${test.id}`}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download PDF
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => copyShareCode(test.shareCode)}
                          data-testid={`button-copy-${test.id}`}
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          Copy Code
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Questions Preview Dialog */}
      <Dialog open={showQuestionsDialog} onOpenChange={setShowQuestionsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{testDetails?.test?.title}</DialogTitle>
            <DialogDescription>
              {testDetails?.test?.subject} • Class {testDetails?.test?.classLevel} • {testDetails?.test?.difficulty}
            </DialogDescription>
          </DialogHeader>
          {testDetails?.questions ? (
            <div className="space-y-6">
              {testDetails.questions.map((q: any, idx: number) => (
                <Card key={q.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Question {idx + 1}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingQuestion(q);
                            setShowManualEditDialog(true);
                          }}
                          data-testid={`button-edit-${q.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingQuestion(q);
                            setShowAIEditDialog(true);
                          }}
                          data-testid={`button-ai-edit-${q.id}`}
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          AI Edit
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="font-medium">{q.question}</p>
                    {q.questionType === "mcq" && q.options && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Options:</p>
                        {q.options.map((opt: string, optIdx: number) => (
                          <div 
                            key={optIdx} 
                            className={`p-2 rounded ${q.correctOption === String.fromCharCode(65 + optIdx) ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'}`}
                          >
                            {String.fromCharCode(65 + optIdx)}. {opt}
                            {q.correctOption === String.fromCharCode(65 + optIdx) && (
                              <Badge variant="default" className="ml-2">Correct</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {q.questionType === "open-ended" && (
                      <div className="p-3 bg-green-100 dark:bg-green-900 rounded">
                        <p className="text-sm font-semibold">Model Answer:</p>
                        <p>{q.correctAnswer}</p>
                      </div>
                    )}
                    {q.explanation && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded">
                        <p className="text-sm font-semibold">Explanation:</p>
                        <p className="text-sm">{q.explanation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual Edit Dialog */}
      {editingQuestion && (
        <Dialog open={showManualEditDialog} onOpenChange={setShowManualEditDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Question</DialogTitle>
              <DialogDescription>
                Manually edit the question, options, answer, and explanation
              </DialogDescription>
            </DialogHeader>
            <ManualEditForm
              question={editingQuestion}
              onSave={(data) => {
                manualEditMutation.mutate({
                  questionId: editingQuestion.id,
                  ...data,
                });
              }}
              onCancel={() => {
                setShowManualEditDialog(false);
                setEditingQuestion(null);
              }}
              isLoading={manualEditMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* AI Edit Dialog */}
      {editingQuestion && (
        <Dialog open={showAIEditDialog} onOpenChange={setShowAIEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>AI-Assisted Edit</DialogTitle>
              <DialogDescription>
                Tell AI what you want to improve about this question
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold text-sm mb-2">Current Question:</p>
                <p className="text-sm">{editingQuestion.question}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Feedback for AI (minimum 10 characters)
                </label>
                <Textarea
                  placeholder="e.g., 'Make it more challenging', 'Simplify the language', 'Fix the incorrect option B', 'Add more detail to the explanation'..."
                  value={aiEditFeedback}
                  onChange={(e) => setAIEditFeedback(e.target.value)}
                  rows={4}
                  data-testid="textarea-ai-feedback"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (aiEditFeedback.trim().length < 10) {
                      toast({
                        variant: "destructive",
                        title: "Feedback too short",
                        description: "Please provide at least 10 characters of feedback",
                      });
                      return;
                    }
                    aiEditMutation.mutate({
                      questionId: editingQuestion.id,
                      feedback: aiEditFeedback,
                    });
                  }}
                  disabled={aiEditMutation.isPending || aiEditFeedback.trim().length < 10}
                  data-testid="button-ai-improve"
                >
                  {aiEditMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Improving...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Improve with AI
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAIEditDialog(false);
                    setEditingQuestion(null);
                    setAIEditFeedback("");
                  }}
                  disabled={aiEditMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Manual Edit Form Component
function ManualEditForm({ question, onSave, onCancel, isLoading }: {
  question: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [questionText, setQuestionText] = useState(question.question);
  const [options, setOptions] = useState(question.options || ["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState(question.correctOption || "A");
  const [correctAnswer, setCorrectAnswer] = useState(question.correctAnswer);
  const [explanation, setExplanation] = useState(question.explanation);

  const isMCQ = question.questionType === "mcq";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Question</label>
        <Textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          rows={3}
          data-testid="textarea-question"
        />
      </div>

      {isMCQ ? (
        <>
          <div className="space-y-3">
            <label className="text-sm font-medium">Options</label>
            {options.map((opt: string, idx: number) => (
              <div key={idx} className="flex gap-2 items-center">
                <span className="font-semibold w-6">{String.fromCharCode(65 + idx)}.</span>
                <Input
                  value={opt}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[idx] = e.target.value;
                    setOptions(newOptions);
                  }}
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  data-testid={`input-option-${idx}`}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Correct Option</label>
            <Select value={correctOption} onValueChange={setCorrectOption}>
              <SelectTrigger data-testid="select-correct-option">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["A", "B", "C", "D"].map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    Option {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <label className="text-sm font-medium">Correct Answer</label>
          <Textarea
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            rows={2}
            data-testid="textarea-correct-answer"
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Explanation</label>
        <Textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={3}
          data-testid="textarea-explanation"
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => {
            onSave({
              question: questionText,
              options: isMCQ ? options : undefined,
              correctOption: isMCQ ? correctOption : undefined,
              correctAnswer: isMCQ ? options[correctOption.charCodeAt(0) - 65] : correctAnswer,
              explanation,
            });
          }}
          disabled={isLoading}
          data-testid="button-save-edit"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
