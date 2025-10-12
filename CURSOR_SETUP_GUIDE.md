# Cursor Setup Guide for Maverick Aim Rush

## ✅ What's Been Set Up

### 1. Project Rules (v2)
- **Location**: `.cursor/rules/` directory
- **Files**: 
  - `00-general.md` - General coding guidelines
  - `10-backend-drf.md` - Django/DRF specific rules with mandatory versioning
  - `20-frontend-react.md` - React/frontend guidelines
  - `90-security.md` - Security best practices
- **Fallback**: `.cursorrules` file for backward compatibility

### 2. Notepads Ready to Import
- **Location**: Root directory (copy these into Cursor's Notepads panel)
- **Files**:
  - `notepad-drf-endpoint.md` - Complete DRF endpoint creation workflow
  - `notepad-frontend-api-client.md` - Frontend API client setup
  - `notepad-security-review.md` - Security review checklist

## 🚀 How to Use

### Step 1: Import Notepads into Cursor
1. Open Cursor
2. Go to Notepads panel (left sidebar)
3. Create new Notepad for each file:
   - "Maverick: Add DRF Endpoint"
   - "Maverick: Frontend API Client" 
   - "Maverick: Security Review"
4. Copy the content from the corresponding `.md` files

### Step 2: Configure Global Rules (Optional)
1. Open Cursor Settings (`Cmd+,` or `Ctrl+,`)
2. Go to **AI → Rules for AI**
3. Add your personal preferences:
```
- Be brief and exact; avoid filler.
- Offer 1–2 alternatives only when relevant.
- Prefer small, inline diffs over rewrites.
- Cite file paths; keep imports intact.
- Ask a clarifying question only if truly blocked.
```

### Step 3: Resync Index
1. After any large file changes, run **Resync Index**
2. Go to Cursor Settings → **Resync Index**
3. This ensures AI has latest context

### Step 4: Use Reference Open Editors
1. Open only the files you're working on
2. In Chat/Composer, click **Reference Open Editors** (or type `/editors`)
3. This focuses AI on exactly what you're editing

## 🎯 Daily Workflow

### Before Coding
1. **Resync Index** if you pulled/merged changes
2. **Close unrelated tabs**; open only target files
3. **Reference Open Editors** in Chat/Composer

### While Coding
1. Use **Notepads** for common tasks:
   - `@Maverick: Add DRF Endpoint` for new API endpoints
   - `@Maverick: Frontend API Client` for frontend integration
   - `@Maverick: Security Review` before merging

2. Ask for **small diffs** and **minimal changes**
3. Use **Composer** for multi-file edits

### After Coding
1. Run tests
2. Update `PROJECT_SUMMARY.md`
3. Commit small, coherent changes

## 🔧 Key Features Now Available

### Mandatory API Versioning
- All new endpoints **must** be under `/api/v1/`
- No exceptions - enforced by rules

### Schema Testing
- **Required** schema snapshot tests for all endpoints
- Prevents frontend/backend drift

### Security-First Approach
- Built-in security review checklist
- Throttling, permissions, and validation requirements

### Production-Ready Defaults
- Pagination caps, error handling, timeout management
- Consistent patterns across frontend and backend

## 🧪 Test the Setup

Try creating a simple endpoint:
1. Open `backend/tracker/models.py`, `serializers.py`, `views.py`, `urls.py`
2. Reference Open Editors
3. Use the DRF Endpoint Notepad
4. Ask: "Add a simple 'goals' endpoint with CRUD operations"

The AI should now:
- Follow your project rules automatically
- Suggest versioned endpoints (`/api/v1/goals/`)
- Include schema tests
- Provide minimal, focused diffs
- Respect your existing code style

## 📚 References

- [Cursor Project Rules](https://docs.cursor.com/context/rules)
- [Cursor Notepads](https://docs.cursor.com/context/notepads)
- [DRF Documentation](https://www.django-rest-framework.org/)
- [React Hooks](https://reactjs.org/docs/hooks-intro.html)

## 🆘 Troubleshooting

### AI suggests old file paths
- **Solution**: Resync Index

### AI ignores your rules
- **Solution**: Check `.cursor/rules/` files exist and are properly formatted

### AI makes large changes
- **Solution**: Ask for "minimal diffs only" and use Reference Open Editors

### Notepads not working
- **Solution**: Ensure you copied the full content into Cursor's Notepads panel
