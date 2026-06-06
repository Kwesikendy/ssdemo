# Sample TXT Files for Demo

These sample files demonstrate the TXT upload feature for SmartScript.

## File Format

Each TXT file has 3 sections separated by `=====`:

1. **OCR Text** - The candidate's exam script text (shown in preview)
2. **Score CSV** - Candidate index and total score
3. **Question Feedback CSV** - Per-question breakdown with scores and feedback

## Example Structure

```
[Candidate's exam answers]
=====
index, score
SS001, 78
=====
question, score, max_marks, feedback
1, 10, 10, Correct
2, 13, 15, Close approximation minor rounding
3, 20, 20, Perfect
4, 25, 25, Correct
5, 10, 30, Only found one solution
```

## Sample Files

- `sample_alice_johnson.txt` - Score: 78/100 (78%)
- `sample_benjamin_osei.txt` - Score: 72/100 (72%)
- `sample_chloe_mensah.txt` - Score: 28/100 (28%)

## How to Use

1. Go to a Group in SmartScript
2. Click "Upload scripts"
3. Select one or more `.txt` files (the UI shows "Upload File" but accepts .txt)
4. The system will:
   - Store the full text internally
   - Show only the first section (OCR text) in previews
   - Use the score and question data when marking
5. Click "Start Marking" on the group
6. The system will compute results from the CSV data (no AI API call needed)
7. View results in the Results page

## Grading Scale

- A: 90%+
- B: 80-89%
- C: 70-79%
- D: 60-69%
- F: Below 60%
