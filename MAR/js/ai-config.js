// AI Configuration Management
class AIConfigManager {
    constructor() {
        this.availableProviders = {
            'openai': {
                name: 'OpenAI GPT-4',
                baseUrl: 'https://api.openai.com/v1',
                models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
                defaultModel: 'gpt-4'
            },
            'anthropic': {
                name: 'Anthropic Claude',
                baseUrl: 'https://api.anthropic.com/v1',
                models: ['claude-3-sonnet', 'claude-3-haiku', 'claude-2.1'],
                defaultModel: 'claude-3-sonnet'
            },
            'local': {
                name: 'Local LLM (Ollama)',
                baseUrl: 'http://localhost:11434',
                models: ['llama2:70b', 'codellama:34b', 'mistral:7b'],
                defaultModel: 'llama2:70b'
            }
        };
        
        this.currentConfig = this.loadConfig();
        this.initializeUI();
    }

    loadConfig() {
        const defaultConfig = {
            provider: 'openai',
            model: 'gpt-4',
            apiKey: '',
            baseUrl: 'https://api.openai.com/v1',
            enabled: false
        };

        try {
            const saved = localStorage.getItem('ai_config');
            return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
        } catch (error) {
            console.error('Failed to load AI config:', error);
            return defaultConfig;
        }
    }

    saveConfig(config) {
        try {
            localStorage.setItem('ai_config', JSON.stringify(config));
            this.currentConfig = config;
            return true;
        } catch (error) {
            console.error('Failed to save AI config:', error);
            return false;
        }
    }

    initializeUI() {
        this.createAIConfigModal();
        this.addAIConfigButton();
    }

    createAIConfigModal() {
        const modalHTML = `
            <div id="ai-config-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:1000;">
                <div style="max-width: 600px; margin: 5vh auto; background:#0f172a; color:#e5e7eb; border-radius:16px; overflow:hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                    <div style="padding:1rem 1.25rem; background: linear-gradient(135deg,#8b5cf6,#7c3aed); display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0; font-size:1.1rem; font-weight:700; color:white;">🤖 AI Configuration</h3>
                        <button onclick="aiConfigManager.closeModal()" style="background:transparent; color:white; border:none; font-size:1.25rem; cursor:pointer;">✕</button>
                    </div>
                    <div style="padding:1rem 1.25rem;">
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">AI Provider</label>
                            <select id="ai-provider" style="width:100%; padding:.6rem; border-radius:8px; border:1px solid #334155; background:#111827; color:#e5e7eb;">
                                ${Object.entries(this.availableProviders).map(([key, provider]) => 
                                    `<option value="${key}">${provider.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Model</label>
                            <select id="ai-model" style="width:100%; padding:.6rem; border-radius:8px; border:1px solid #334155; background:#111827; color:#e5e7eb;">
                                <!-- Models will be populated dynamically -->
                            </select>
                        </div>
                        
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">API Key</label>
                            <input id="ai-api-key" type="password" placeholder="Enter your API key" style="width:100%; padding:.6rem; border-radius:8px; border:1px solid #334155; background:#111827; color:#e5e7eb;" />
                            <small style="color: #9ca3af; font-size: 0.875rem;">
                                Your API key is stored locally and never shared
                            </small>
                        </div>
                        
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Base URL (Optional)</label>
                            <input id="ai-base-url" type="text" placeholder="Custom API endpoint" style="width:100%; padding:.6rem; border-radius:8px; border:1px solid #334155; background:#111827; color:#e5e7eb;" />
                        </div>
                        
                        <div style="margin-bottom: 1rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem;">
                                <input id="ai-enabled" type="checkbox" style="transform: scale(1.2);" />
                                <span style="font-weight: 600;">Enable AI Features</span>
                            </label>
                            <small style="color: #9ca3af; font-size: 0.875rem;">
                                When enabled, the system will use AI for personalized recommendations
                            </small>
                        </div>
                        
                        <div id="ai-test-section" style="margin-bottom: 1rem; padding: 1rem; background: #1f2937; border-radius: 8px; display: none;">
                            <h4 style="margin: 0 0 0.5rem 0; color: #10b981;">🧪 Test AI Connection</h4>
                            <button id="test-ai-btn" onclick="aiConfigManager.testConnection()" style="background: #10b981; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;">
                                Test Connection
                            </button>
                            <div id="ai-test-result" style="margin-top: 0.5rem;"></div>
                        </div>
                    </div>
                    <div style="padding:1rem 1.25rem; display:flex; justify-content:flex-end; gap:.5rem; background:#0b1220;">
                        <button onclick="aiConfigManager.closeModal()" style="background:#334155; color:white; border:none; padding:.6rem 1rem; border-radius:8px; cursor:pointer;">Cancel</button>
                        <button onclick="aiConfigManager.saveConfig()" style="background:#10b981; color:white; border:none; padding:.6rem 1rem; border-radius:8px; cursor:pointer; font-weight:700;">Save Configuration</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.populateCurrentConfig();
        this.setupEventListeners();
    }

    addAIConfigButton() {
        const suggestionControls = document.querySelector('.suggestion-controls');
        if (suggestionControls) {
            const aiConfigBtn = document.createElement('button');
            aiConfigBtn.innerHTML = '⚙️ AI Settings';
            aiConfigBtn.className = 'suggestion-btn';
            aiConfigBtn.style.cssText = 'background: linear-gradient(135deg, #6b7280, #4b5563); color: white; border: none; padding: 1rem 2rem; border-radius: 12px; font-weight: 600; font-size: 1.1rem; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(107, 114, 128, 0.3);';
            aiConfigBtn.onclick = () => this.openModal();
            suggestionControls.appendChild(aiConfigBtn);
        }
    }

    populateCurrentConfig() {
        const providerSelect = document.getElementById('ai-provider');
        const modelSelect = document.getElementById('ai-model');
        const apiKeyInput = document.getElementById('ai-api-key');
        const baseUrlInput = document.getElementById('ai-base-url');
        const enabledCheckbox = document.getElementById('ai-enabled');

        if (providerSelect) providerSelect.value = this.currentConfig.provider;
        if (apiKeyInput) apiKeyInput.value = this.currentConfig.apiKey;
        if (baseUrlInput) baseUrlInput.value = this.currentConfig.baseUrl;
        if (enabledCheckbox) enabledCheckbox.checked = this.currentConfig.enabled;

        this.updateModels();
    }

    setupEventListeners() {
        const providerSelect = document.getElementById('ai-provider');
        if (providerSelect) {
            providerSelect.addEventListener('change', () => this.updateModels());
        }

        const apiKeyInput = document.getElementById('ai-api-key');
        if (apiKeyInput) {
            apiKeyInput.addEventListener('input', () => this.toggleTestSection());
        }
    }

    updateModels() {
        const providerSelect = document.getElementById('ai-provider');
        const modelSelect = document.getElementById('ai-model');
        
        if (!providerSelect || !modelSelect) return;

        const selectedProvider = providerSelect.value;
        const provider = this.availableProviders[selectedProvider];
        
        modelSelect.innerHTML = provider.models.map(model => 
            `<option value="${model}">${model}</option>`
        ).join('');

        // Set default model
        modelSelect.value = provider.defaultModel;
    }

    toggleTestSection() {
        const apiKeyInput = document.getElementById('ai-api-key');
        const testSection = document.getElementById('ai-test-section');
        
        if (apiKeyInput && testSection) {
            testSection.style.display = apiKeyInput.value.trim() ? 'block' : 'none';
        }
    }

    openModal() {
        const modal = document.getElementById('ai-config-modal');
        if (modal) {
            modal.style.display = 'block';
            this.populateCurrentConfig();
        }
    }

    closeModal() {
        const modal = document.getElementById('ai-config-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async testConnection() {
        const testBtn = document.getElementById('test-ai-btn');
        const testResult = document.getElementById('ai-test-result');
        
        if (testBtn) testBtn.disabled = true;
        if (testResult) testResult.innerHTML = '<div style="color: #f59e0b;">Testing connection...</div>';

        try {
            const config = this.getFormConfig();
            const aiEngine = new AIEngine();
            aiEngine.apiKey = config.apiKey;
            aiEngine.model = config.model;
            aiEngine.baseUrl = config.baseUrl;

            // Test with a simple prompt
            const testPrompt = 'Respond with "AI connection successful"';
            const response = await aiEngine.callLLM(testPrompt);
            
            if (testResult) {
                testResult.innerHTML = `
                    <div style="color: #10b981; padding: 0.5rem; background: #064e3b; border-radius: 4px;">
                        ✅ Connection successful! AI is ready to use.
                    </div>
                `;
            }
        } catch (error) {
            if (testResult) {
                testResult.innerHTML = `
                    <div style="color: #ef4444; padding: 0.5rem; background: #7f1d1d; border-radius: 4px;">
                        ❌ Connection failed: ${error.message}
                    </div>
                `;
            }
        } finally {
            if (testBtn) testBtn.disabled = false;
        }
    }

    getFormConfig() {
        const providerSelect = document.getElementById('ai-provider');
        const modelSelect = document.getElementById('ai-model');
        const apiKeyInput = document.getElementById('ai-api-key');
        const baseUrlInput = document.getElementById('ai-base-url');
        const enabledCheckbox = document.getElementById('ai-enabled');

        const provider = providerSelect?.value || 'openai';
        const providerConfig = this.availableProviders[provider];

        return {
            provider: provider,
            model: modelSelect?.value || providerConfig.defaultModel,
            apiKey: apiKeyInput?.value || '',
            baseUrl: baseUrlInput?.value || providerConfig.baseUrl,
            enabled: enabledCheckbox?.checked || false
        };
    }

    saveConfig() {
        const config = this.getFormConfig();
        
        if (config.enabled && !config.apiKey.trim()) {
            alert('Please enter an API key to enable AI features.');
            return;
        }

        if (this.saveConfig(config)) {
            this.closeModal();
            
            // Show success message
            if (window.workoutSuggestionsAI) {
                window.workoutSuggestionsAI.showToast(
                    config.enabled ? 'AI configuration saved! 🤖' : 'AI features disabled',
                    'success'
                );
            }

            // Reload the AI system if it exists
            if (window.workoutSuggestionsAI && window.workoutSuggestionsAI.aiEngine) {
                window.workoutSuggestionsAI.aiEngine.initializeAI();
            }
        } else {
            alert('Failed to save configuration. Please try again.');
        }
    }

    isAIEnabled() {
        return this.currentConfig.enabled && this.currentConfig.apiKey.trim();
    }

    getCurrentConfig() {
        return this.currentConfig;
    }
}

// Initialize AI Config Manager
window.aiConfigManager = new AIConfigManager();
