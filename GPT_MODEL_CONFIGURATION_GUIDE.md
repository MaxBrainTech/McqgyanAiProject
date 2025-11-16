# GPT Model Configuration Guide for MCQGyaan AI

## Overview
Your app is now configured to use your own OpenAI API key. The code automatically uses your `OPENAI_API_KEY` if provided, otherwise falls back to Replit's integration.

---

## Current Configuration

**File:** `server/openai.ts`

The app is currently using **GPT-4o-mini** which is:
- **Cost-effective**: ~$0.15 per million tokens (very affordable)
- **Fast**: Quick response times
- **Capable**: Excellent for educational question generation
- **Estimated cost per test**: Less than $0.01 for a 10-question test

---

## Available GPT Models

### 1. **GPT-4o-mini** (Currently Active) ⭐ RECOMMENDED
```typescript
const CURRENT_MODEL = GPT_MODELS.STANDARD; // "gpt-4o-mini"
```
- **Best for**: Educational content, question generation, student feedback
- **Cost**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **Speed**: Very fast
- **Use case**: Perfect for your app - excellent quality at low cost

### 2. **GPT-4o** (Most Capable)
```typescript
const CURRENT_MODEL = GPT_MODELS.ADVANCED; // "gpt-4o"
```
- **Best for**: Complex reasoning, advanced analysis, highest quality
- **Cost**: ~$2.50 per 1M input tokens, ~$10 per 1M output tokens
- **Speed**: Fast
- **Use case**: If you need the absolute best quality and cost isn't a concern

### 3. **GPT-3.5-turbo** (Cheapest)
```typescript
const CURRENT_MODEL = "gpt-3.5-turbo";
```
- **Best for**: Simple tasks, highest speed, minimal cost
- **Cost**: ~$0.50 per 1M input tokens, ~$1.50 per 1M output tokens
- **Speed**: Fastest
- **Use case**: If you're on a tight budget (but quality may be lower)

### 4. **GPT-4-turbo** (With Vision)
```typescript
const CURRENT_MODEL = "gpt-4-turbo";
```
- **Best for**: Tasks requiring image analysis
- **Cost**: ~$10 per 1M input tokens, ~$30 per 1M output tokens
- **Speed**: Moderate
- **Use case**: If you plan to add image-based questions

---

## How to Change Models

### Option 1: Global Model Change (Affects All Features)

**Edit `server/openai.ts` line 23:**

```typescript
// Change this line to switch models
const CURRENT_MODEL = GPT_MODELS.STANDARD;  // Current setting

// To use the most capable model:
const CURRENT_MODEL = GPT_MODELS.ADVANCED;  // Use GPT-4o

// To use the cheapest model:
const CURRENT_MODEL = "gpt-3.5-turbo";
```

### Option 2: Feature-Specific Models (Advanced)

You can use different models for different features:

```typescript
// Example: Use different models for different tasks
const QUESTION_GENERATION_MODEL = "gpt-4o-mini";     // For creating questions
const ANSWER_EVALUATION_MODEL = "gpt-3.5-turbo";     // For grading (simpler task)
const VERIFICATION_MODEL = "gpt-4o";                 // For quality checks (higher accuracy)
```

Then update each function's API call to use the appropriate model.

---

## Advanced Configuration Options

### 1. Temperature (Creativity Control)

**What it does**: Controls randomness in responses
- **0.0-0.3**: Very deterministic, consistent (best for factual content)
- **0.4-0.7**: Balanced creativity (good for varied questions)
- **0.8-1.0**: More creative, diverse (may be less accurate)

**Current setting**: 0.7 (in most functions)

**How to change:**
```typescript
const response = await openai.chat.completions.create({
  model: CURRENT_MODEL,
  temperature: 0.5,  // Change this value (0.0 to 1.0)
  // ... other params
});
```

### 2. Max Tokens (Response Length)

**What it does**: Controls maximum length of AI responses

**Current settings:**
- Question generation: 2000 tokens
- Answer evaluation: 500 tokens
- Custom test generation: 4000 tokens

**How to change:**
```typescript
const response = await openai.chat.completions.create({
  model: CURRENT_MODEL,
  max_completion_tokens: 3000,  // Increase/decrease as needed
  // ... other params
});
```

### 3. Top-P (Nucleus Sampling)

**What it does**: Alternative to temperature for controlling randomness
- **0.1**: Very focused, deterministic
- **1.0**: Full diversity

**How to add:**
```typescript
const response = await openai.chat.completions.create({
  model: CURRENT_MODEL,
  top_p: 0.9,  // Add this parameter
  // ... other params
});
```

### 4. Frequency Penalty & Presence Penalty

**What they do**: Reduce repetition in responses
- **Frequency penalty**: Penalizes repeated tokens based on frequency
- **Presence penalty**: Penalizes any repeated tokens

**How to add:**
```typescript
const response = await openai.chat.completions.create({
  model: CURRENT_MODEL,
  frequency_penalty: 0.5,  // 0.0 to 2.0
  presence_penalty: 0.3,   // 0.0 to 2.0
  // ... other params
});
```

---

## Cost Optimization Tips

### 1. **Use Streaming for Long Responses**
Currently not implemented, but you can add streaming to save costs:
```typescript
const stream = await openai.chat.completions.create({
  model: CURRENT_MODEL,
  messages: [...],
  stream: true,
});
```

### 2. **Reduce max_completion_tokens**
Lower token limits = lower costs. Review if you really need 2000+ tokens per response.

### 3. **Use Caching**
Store generated questions in database to avoid regenerating the same content.

### 4. **Batch Requests**
Generate multiple questions in one API call instead of separate calls.

---

## Monitoring Usage & Costs

### View Your OpenAI Usage:
1. Go to https://platform.openai.com/usage
2. See detailed breakdown of API calls
3. Set usage limits to control spending

### Recommended Limits:
- **Soft limit**: $10/month (for development)
- **Hard limit**: $50/month (prevents unexpected charges)

---

## Model Selection Guide by Feature

| Feature | Recommended Model | Reasoning |
|---------|------------------|-----------|
| Question Generation | GPT-4o-mini | Excellent quality, low cost |
| Answer Evaluation | GPT-3.5-turbo | Simple task, save money |
| Quality Verification | GPT-4o | Needs highest accuracy |
| Custom Tests | GPT-4o-mini | Balanced quality/cost |
| Student Feedback | GPT-4o-mini | Good explanations, affordable |

---

## Testing Different Models

Try generating a test with different models and compare:

1. **Quality**: Are questions accurate and age-appropriate?
2. **Speed**: How fast are responses?
3. **Cost**: Check your OpenAI usage dashboard
4. **Consistency**: Generate same test multiple times - are results similar?

---

## Questions?

- **OpenAI Pricing**: https://openai.com/pricing
- **API Documentation**: https://platform.openai.com/docs
- **Model Comparison**: https://platform.openai.com/docs/models

---

## Current Status ✅

✅ Your app is now using your own OpenAI API key
✅ Currently configured with GPT-4o-mini (cost-effective choice)
✅ All 6 model API calls updated to use configurable model
✅ Ready to generate questions with your account

**Next steps**: Just use the app normally - it will bill to your OpenAI account!
