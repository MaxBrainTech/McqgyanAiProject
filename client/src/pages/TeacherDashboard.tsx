import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  language: z.enum(["english", "hindi"]), 
  classLevel: z.number().min(6).max(12),
  difficulty: z.enum(["easy", "medium", "hard"]),
  topic1: z.string().min(3, "Topic 1 is required (minimum 3 characters)"),
  topic2: z.string().optional(),
  topic3: z.string().optional(),
  topic4: z.string().optional(),
  numQuestions: z.number().min(5).max(50),
  testType: z.enum(["mcq", "open-ended", "mixed"]),
  gptModel: z.enum(["gpt-4o", "gpt-4o-mini"]),
  instructions: z.string().optional(),
});

type TestForm = z.infer<typeof testSchema>;

const SUBJECTS = [
  { value: "Physics", label: "Physics" },
  { value: "Chemistry", label: "Chemistry" },
  { value: "Biology", label: "Biology" },
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi" },
  { value: "Marathi", label: "Marathi" },
  { value: "Kannada", label: "Kannada" },
  { value: "Sanskrit", label: "Sanskrit" },
  { value: "Mathematics", label: "Mathematics" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Spanish", label: "Spanish" },
  { value: "General", label: "General Science" },
  { value: "Social Studies", label: "Social Studies" },
];

export default function TeacherDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const teacherData = location.state?.teacherData;

  // Redirect to teacher auth if no teacher data
  useEffect(() => {
    if (!teacherData) {
      navigate('/teacher-auth');
    }
  }, [teacherData, navigate]);

  // Return loading state while redirecting if no teacher data
  if (!teacherData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-base sm:text-lg font-semibold text-primary">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    navigate('/');
  };
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
      language: "english", 
      classLevel: 9,
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
      language: data.language,   // ✅ correct
      classLevel: data.classLevel,
      difficulty: data.difficulty,
      syllabus: topics,
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
      queryClient.refetchQueries({ queryKey: [`/api/teacher/${teacherData.id}/tests`] });
      form.reset();
      setShowForm(false);
      // Show the questions dialog
      setSelectedTestId(result.test.id);
        setTimeout(() => {
        setShowQuestionsDialog(true);
      }, 300);
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

      // Create PDF with jsPDF for professional formatting
      const pdf = new (jsPDF as any)({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margins = { top: 15, bottom: 15, left: 15, right: 15 };
      const contentWidth = pageWidth - margins.left - margins.right;
      let yPosition = margins.top;

      // Helper function to add text with wrapping
      const addWrappedText = (text: string, x: number, maxWidth: number, fontSize: number, isBold: boolean = false) => {
        pdf.setFontSize(fontSize);
        if (isBold) pdf.setFont(undefined, 'bold');
        else pdf.setFont(undefined, 'normal');

        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, yPosition);
        yPosition += lines.length * (fontSize * 0.35) + 2;
        return lines.length;
      };
     // ===== HEADER BACKGROUND =====
      // ======= HEADER SECTION =======
      pdf.setFillColor(30, 41, 59); // dark navy background
      pdf.rect(0, 0, pageWidth, 32, "F");

      // ---- Test Title (Left side) ----
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont(undefined, "bold");
      pdf.text(data.test.title, margins.left, 18);

      // ===== RIGHT SIDE BRAND (NO LOGO) =====
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");

      // Text
      const brandText = "MCQGyaan AI";

      // Text width calculate
      const brandTextWidth = pdf.getTextWidth(brandText);

      // Right align position
      const brandX = pageWidth - margins.right - brandTextWidth;

      // White text
      pdf.setTextColor(255, 255, 255);

      // Print brand name
      pdf.text(brandText, brandX, 18);

      // Reset text color
      pdf.setTextColor(0, 0, 0);

      // Start content position
      yPosition = 42;

      pdf.setDrawColor(200);
      pdf.line(margins.left, 30, pageWidth - margins.right, 30);


      // Test Info Section
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.text('Test Information', margins.left, yPosition);
      yPosition += 8;

      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(9);
      const testInfo = [
        `Subject: ${data.test.subject}`,
        `Class: ${data.test.classLevel}`,
        `Difficulty: ${data.test.difficulty}`,
        `Total Questions: ${data.questions.length}`,
        `Share Code: ${data.test.shareCode}`
      ];

      testInfo.forEach(info => {
        pdf.text(info, margins.left, yPosition);
        yPosition += 5;
      });

      yPosition += 3;

      // Instructions section if present
      if (data.test.instructions) {
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margins.left, yPosition - 2, contentWidth, 20, 'F');
        pdf.setFont(undefined, 'bold');
        pdf.setFontSize(10);
        pdf.text('Instructions:', margins.left + 3, yPosition + 2);
        yPosition += 6;

        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(9);
        const instructionLines = pdf.splitTextToSize(data.test.instructions, contentWidth - 6);
        pdf.text(instructionLines, margins.left + 3, yPosition);
        yPosition += instructionLines.length * 4 + 3;
      }



      // Questions section
      pdf.text('Questions', margins.left, yPosition + 5);
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margins.left, yPosition, contentWidth, 8, 'F');

      pdf.setFontSize(11);
      pdf.setFont(undefined, "bold");
      pdf.text("Questions", pageWidth / 2, yPosition + 6, { align: "center" });

      yPosition += 12;
      // pdf.setFont(undefined, 'bold');
      // pdf.setFontSize(10);
      // pdf.text('Questions', margins.left, yPosition + 5);
      // yPosition += 10;

      // Add questions
      data.questions.forEach((q: any, idx: number) => {
        // Check if we need a new page
        if (yPosition > pageHeight - margins.bottom - 20) {
          pdf.addPage();
          yPosition = margins.top;
        }

        // Question number and text
        pdf.setFont(undefined, 'bold');
        pdf.setFontSize(10);
        pdf.text(`Q${idx + 1}.`, margins.left, yPosition);
        yPosition += 5;

        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(9);
        const questionLines = pdf.splitTextToSize(q.question, contentWidth - 5);
        pdf.text(questionLines, margins.left + 5, yPosition);
        yPosition += questionLines.length * 3.5 + 2;

        // Options for MCQ
        if (q.questionType === 'mcq' && q.options) {
          pdf.setFontSize(8.5);
          q.options.forEach((opt: string, optIdx: number) => {
            if (yPosition > pageHeight - margins.bottom - 10) {
              pdf.addPage();
              yPosition = margins.top;
            }

            const optionLetter = String.fromCharCode(65 + optIdx);
            const optionLines = pdf.splitTextToSize(`${optionLetter}. ${opt}`, contentWidth - 8);
            pdf.text(optionLines, margins.left + 8, yPosition);
            yPosition += optionLines.length * 3.2 + 1;
          });
        }

        // Model answer for open-ended
        if (q.questionType === 'open-ended') {
          pdf.setFont(undefined, 'bold');
          pdf.setFontSize(8);
          pdf.text('Answer: _____________________________________', margins.left + 5, yPosition);
          yPosition += 4;
        }

        yPosition += 4;
      });

      // Footer on each page
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
      }

      // Save the PDF
      pdf.save(`${data.test.title}_${data.test.shareCode}.pdf`);

      toast({
        title: "Success!",
        description: "Question paper downloaded as PDF",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate question paper",
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
            onClick={handleLogout}
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

            <div className="flex items-center justify-between">

              <CardTitle>Create Custom MCQ Test</CardTitle>

              <div className="flex gap-2">
                <Button
                  type="button"
                  className="h-8 px-3 text-sm"
                  variant={form.watch("language") === "english" ? "default" : "outline"}
                  onClick={() => form.setValue("language", "english")}
                >
                  English
                </Button>

                <Button
                  type="button"
                  className="h-8 px-3 text-sm"
                  variant={form.watch("language") === "hindi" ? "default" : "outline"}
                  onClick={() => form.setValue("language", "hindi")}
                >
                  हिंदी
                </Button>
              </div>

            </div>

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
                              {[6, 7, 8, 9, 10, 11, 12].map((cls) => (
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
                              <SelectItem value="gpt-4o">
                                GPT-4o (Best Quality - Premium) ⭐
                              </SelectItem>
                              <SelectItem value="gpt-4o-mini">
                                GPT-4o Mini (Fast & Affordable - Recommended) ⚡
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
