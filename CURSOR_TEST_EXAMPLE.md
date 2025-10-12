# Cursor Setup Test - Example Usage

## 🧪 Test the Cursor Configuration

Here's how to test that your Cursor setup is working correctly:

### Test 1: Create a Simple Endpoint

**Scenario**: Add a new "achievements" endpoint for tracking user achievements.

**Steps**:
1. Open these files in Cursor:
   - `backend/tracker/models.py`
   - `backend/tracker/serializers.py` 
   - `backend/tracker/views.py`
   - `backend/tracker/urls.py`
   - `backend/tracker/tests/`

2. In Cursor Chat, type: `/editors` (to reference open editors)

3. Use the DRF Endpoint Notepad by typing: `@Maverick: Add DRF Endpoint`

4. Ask: "Add a simple achievements endpoint with CRUD operations"

**Expected Behavior**:
- AI should suggest endpoints under `/api/v1/achievements/` (not just `/api/achievements/`)
- Should include schema snapshot tests
- Should provide minimal diffs only
- Should follow your existing code patterns

### Test 2: Frontend API Client

**Scenario**: Create a React hook for the achievements endpoint.

**Steps**:
1. Open: `frontend/app/src/` directory
2. Reference Open Editors
3. Use: `@Maverick: Frontend API Client`
4. Ask: "Create API client and hook for achievements endpoint"

**Expected Behavior**:
- Should create `frontend/app/src/api/client.js`
- Should create `frontend/app/src/api/achievements.js`
- Should create `frontend/app/src/api/useAchievements.js`
- Should include timeout, error handling, and AbortController

### Test 3: Security Review

**Scenario**: Review the new achievements endpoint for security issues.

**Steps**:
1. Use: `@Maverick: Security Review`
2. Ask: "Review the achievements endpoint for security issues"

**Expected Behavior**:
- Should check permissions, serializers, throttling
- Should provide specific security recommendations
- Should suggest minimal fixes

## 🎯 What Success Looks Like

### ✅ Good AI Response
```
I'll add a minimal achievements endpoint under /api/v1/ as required.

Changes needed:
1. Model in tracker/models.py
2. Serializer in tracker/serializers.py  
3. ViewSet in tracker/views.py
4. Router registration in tracker/urls.py
5. Schema test in tracker/tests/

Here are the minimal diffs:
[small, focused changes only]
```

### ❌ Bad AI Response
```
I'll create a comprehensive achievements system with multiple endpoints...
[large refactor, ignores versioning, no tests]
```

## 🔧 Troubleshooting

### If AI ignores versioning:
- Check `.cursor/rules/10-backend-drf.md` exists
- Verify the rule mentions "MANDATORY: All new endpoints must be under /api/v1/"

### If AI makes large changes:
- Ask for "minimal diffs only"
- Use Reference Open Editors to focus scope
- Check your global Rules for AI settings

### If Notepads don't work:
- Ensure you copied the full content into Cursor's Notepads
- Try typing `@` and see if your Notepads appear in the dropdown

## 📝 Sample Test Request

Copy this into Cursor Chat to test:

```
@Maverick: Add DRF Endpoint

Add a simple "user-preferences" endpoint with:
- Model: UserPreference with fields: user (FK), theme (CharField), notifications (BooleanField)
- Permissions: User can only access their own preferences
- CRUD operations: list, retrieve, create, update, delete
- Page size cap: 25

Make minimal changes only, follow existing patterns, and ensure it's under /api/v1/.
```

This should trigger all the rules and demonstrate the complete workflow working correctly.
