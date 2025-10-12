# Contributing to Maverick Aim Rush

Thank you for your interest in contributing to Maverick Aim Rush! We welcome contributions from the community and appreciate your help in making this fitness platform even better.

## 🚀 Getting Started

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/maverick-aim-rush.git
   cd maverick-aim-rush
   ```

3. **Set up the backend**:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py runserver
   ```

4. **Set up the frontend**:
   ```bash
   cd ../MAR
   python -m http.server 8001
   ```

## 📝 Code Style Guidelines

### Python (Backend)
- Follow **PEP 8** style guidelines
- Use meaningful variable and function names
- Add docstrings for all functions and classes
- Maximum line length: 127 characters
- Use type hints where appropriate

### JavaScript (Frontend)
- Use **ES6+** features
- Follow consistent naming conventions (camelCase for variables, PascalCase for classes)
- Add JSDoc comments for complex functions
- Use meaningful variable names
- Prefer `const` and `let` over `var`

### HTML/CSS
- Use semantic HTML5 elements
- Follow BEM methodology for CSS class naming
- Ensure accessibility (WCAG 2.1 AA compliance)
- Use responsive design principles

## 🧪 Testing

### Backend Testing
```bash
cd backend
python manage.py test
```

### Frontend Testing
- Test all new features manually across different browsers
- Ensure mobile responsiveness
- Test accessibility features
- Verify real-time functionality (WebSockets)

## 📋 Pull Request Process

### Before Submitting
1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Write clean, well-documented code
   - Add tests for new functionality
   - Update documentation if needed

3. **Test thoroughly**:
   - Run all existing tests
   - Test your changes manually
   - Ensure no breaking changes

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Add: Brief description of your changes"
   ```

### Submitting a Pull Request

1. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request** on GitHub with:
   - Clear title describing the changes
   - Detailed description of what was implemented
   - Screenshots/GIFs for UI changes
   - Reference any related issues

3. **PR Template**:
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Tests pass locally
   - [ ] Manual testing completed
   - [ ] No breaking changes

   ## Screenshots (if applicable)
   Add screenshots or GIFs here

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] No console errors
   ```

## 🐛 Reporting Issues

### Bug Reports
When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser/device information
- Console errors (if any)

### Feature Requests
For new features:
- Clear description of the proposed feature
- Use cases and benefits
- Mockups or examples if applicable
- Consider implementation complexity

## 🎯 Areas for Contribution

### High Priority
- **Mobile Optimization**: Improve mobile user experience
- **Performance**: Optimize loading times and responsiveness
- **Accessibility**: Enhance WCAG compliance
- **Testing**: Add more comprehensive test coverage
- **Documentation**: Improve API and setup documentation

### Feature Areas
- **AI/ML**: Enhance recommendation algorithms
- **Social Features**: Improve community functionality
- **Analytics**: Add more detailed progress tracking
- **Gamification**: Create new achievement systems
- **Notifications**: Enhance push notification system

### Technical Improvements
- **Security**: Enhance authentication and data protection
- **API**: Add more RESTful endpoints
- **Real-time**: Improve WebSocket functionality
- **PWA**: Enhance offline capabilities
- **Database**: Optimize queries and schema

## 🏷️ Issue Labels

We use the following labels to categorize issues:
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `priority: high` - High priority issues
- `priority: low` - Low priority issues

## 💬 Community Guidelines

### Communication
- Be respectful and constructive
- Use clear, descriptive language
- Ask questions if you're unsure
- Help others when possible

### Code Review
- Provide constructive feedback
- Focus on code quality and maintainability
- Be patient with contributors
- Celebrate good contributions

## 🎉 Recognition

Contributors will be recognized in:
- GitHub contributors list
- Project README acknowledgments
- Release notes for significant contributions

## 📞 Getting Help

If you need help:
1. Check existing issues and discussions
2. Join our GitHub Discussions
3. Create an issue with the `question` label
4. Contact maintainers directly

## 📄 License

By contributing to Maverick Aim Rush, you agree that your contributions will be licensed under the same MIT License that covers the project.

---

Thank you for contributing to Maverick Aim Rush! Together, we can build an amazing fitness platform. 🏋️‍♂️
