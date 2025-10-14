// Data Export/Import functionality for Maverick Aim Rush
class DataExportManager {
  constructor() {
    this.apiBaseUrl = 'http://localhost:8000';
    this.init();
  }

  init() {
    this.setupEventListeners();
    // Only load export status if user is authenticated
    this.checkAuthAndLoadStatus();
  }

  async checkAuthAndLoadStatus() {
    const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
    if (token) {
      this.loadExportStatus();
    }
  }

  setupEventListeners() {
    // Export buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-export="json"]')) {
        this.exportData('json');
      } else if (e.target.matches('[data-export="csv"]')) {
        this.exportData('csv');
      } else if (e.target.matches('[data-export="summary"]')) {
        this.exportData('summary');
      } else if (e.target.matches('[data-import]')) {
        this.showImportModal();
      }
    });

    // File input for import
    const fileInput = document.getElementById('import-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        this.handleFileImport(e.target.files[0]);
      });
    }
  }

  async loadExportStatus() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/export-status/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const status = await response.json();
        this.updateExportInfo(status);
      }
    } catch (error) {
      console.error('Error loading export status:', error);
    }
  }

  updateExportInfo(status) {
    const infoElement = document.getElementById('export-info');
    if (infoElement) {
      infoElement.innerHTML = `
        <div class="export-info">
          <h4>📊 Data Export Information</h4>
          <p><strong>Available Formats:</strong> ${status.available_formats.join(', ')}</p>
          <p><strong>Supported Import:</strong> ${status.supported_import_formats.join(', ')}</p>
          <p><strong>Max File Size:</strong> ${status.max_file_size}</p>
          <p><strong>Data Types:</strong> ${status.data_types.length} types available</p>
        </div>
      `;
    }
  }

  async exportData(format) {
    try {
      this.showLoadingState(`Exporting data as ${format.toUpperCase()}...`);
      
      const response = await fetch(`${this.apiBaseUrl}/export/?format=${format}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `maverick_fitness_data_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${format === 'summary' ? 'txt' : format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        this.showSuccessMessage(`Data exported successfully as ${format.toUpperCase()}!`);
      } else {
        const error = await response.json();
        this.showErrorMessage(`Export failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      this.showErrorMessage('Export failed. Please try again.');
    } finally {
      this.hideLoadingState();
    }
  }

  showImportModal() {
    const modal = document.getElementById('import-modal');
    if (modal) {
      modal.style.display = 'block';
    } else {
      this.createImportModal();
    }
  }

  createImportModal() {
    const modalHTML = `
      <div id="import-modal" class="import-modal" style="display: block;">
        <div class="import-modal__overlay"></div>
        <div class="import-modal__content">
          <div class="import-modal__header">
            <h3>📥 Import Data</h3>
            <button id="close-import-modal" class="import-modal__close">×</button>
          </div>
          <div class="import-modal__body">
            <div class="import-options">
              <h4>Import Options</h4>
              <div class="import-option">
                <label>
                  <input type="checkbox" id="import-workouts" checked>
                  Import Workouts
                </label>
              </div>
              <div class="import-option">
                <label>
                  <input type="checkbox" id="import-nutrition" checked>
                  Import Nutrition Logs
                </label>
              </div>
              <div class="import-option">
                <label>
                  <input type="checkbox" id="import-schedules" checked>
                  Import Weekly Schedules
                </label>
              </div>
              <div class="import-option">
                <label>
                  <input type="checkbox" id="import-progress" checked>
                  Import Progress Data
                </label>
              </div>
              <div class="import-option">
                <label>
                  <input type="checkbox" id="import-social" checked>
                  Import Social Data
                </label>
              </div>
              <div class="import-option">
                <label>
                  <input type="checkbox" id="overwrite-profile">
                  Overwrite Existing Profile
                </label>
              </div>
            </div>
            
            <div class="file-upload">
              <h4>Select File</h4>
              <input type="file" id="import-file-input" accept=".json" />
              <p class="file-info">Only JSON files exported from Maverick Aim Rush are supported.</p>
            </div>
            
            <div class="import-actions">
              <button id="cancel-import" class="button button--secondary">Cancel</button>
              <button id="start-import" class="button button--primary" disabled>Import Data</button>
            </div>
            
            <div id="import-progress" class="import-progress" style="display: none;">
              <div class="progress-bar">
                <div class="progress-fill"></div>
              </div>
              <p class="progress-text">Importing data...</p>
            </div>
            
            <div id="import-results" class="import-results" style="display: none;">
              <h4>Import Results</h4>
              <div id="import-success" class="import-success"></div>
              <div id="import-errors" class="import-errors"></div>
              <div id="import-warnings" class="import-warnings"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.addImportModalStyles();
    this.setupImportModalEvents();
  }

  addImportModalStyles() {
    const styles = `
      <style>
        .import-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10000;
        }
        
        .import-modal__overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(5px);
        }
        
        .import-modal__content {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          border-radius: 15px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .import-modal__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #eee;
        }
        
        .import-modal__close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
        }
        
        .import-modal__body {
          padding: 1.5rem;
        }
        
        .import-options {
          margin-bottom: 2rem;
        }
        
        .import-options h4 {
          margin-bottom: 1rem;
          color: #333;
          font-family: 'Righteous', cursive;
        }
        
        .import-option {
          margin-bottom: 0.5rem;
        }
        
        .import-option label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        
        .file-upload {
          margin-bottom: 2rem;
          padding: 1rem;
          border: 2px dashed #ddd;
          border-radius: 10px;
          text-align: center;
        }
        
        .file-upload h4 {
          margin-bottom: 1rem;
          color: #333;
          font-family: 'Righteous', cursive;
        }
        
        .file-info {
          color: #666;
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }
        
        .import-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-bottom: 2rem;
        }
        
        .import-progress {
          margin-bottom: 2rem;
        }
        
        .progress-bar {
          width: 100%;
          height: 20px;
          background: #f0f0f0;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 1rem;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #ff6b35, #f7931e);
          width: 0%;
          transition: width 0.3s ease;
        }
        
        .progress-text {
          text-align: center;
          color: #666;
        }
        
        .import-results {
          padding: 1rem;
          border-radius: 10px;
          background: #f9f9f9;
        }
        
        .import-success {
          color: #4CAF50;
          margin-bottom: 1rem;
        }
        
        .import-errors {
          color: #f44336;
          margin-bottom: 1rem;
        }
        
        .import-warnings {
          color: #ff9800;
        }
        
        @media (max-width: 768px) {
          .import-modal__content {
            width: 95%;
            margin: 1rem;
          }
          
          .import-actions {
            flex-direction: column;
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  setupImportModalEvents() {
    // Close modal
    document.getElementById('close-import-modal').addEventListener('click', () => {
      this.closeImportModal();
    });

    // Cancel import
    document.getElementById('cancel-import').addEventListener('click', () => {
      this.closeImportModal();
    });

    // File input change
    document.getElementById('import-file-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      const importBtn = document.getElementById('start-import');
      
      if (file) {
        importBtn.disabled = false;
        importBtn.addEventListener('click', () => {
          this.handleFileImport(file);
        });
      } else {
        importBtn.disabled = true;
      }
    });

    // Overlay click to close
    document.querySelector('.import-modal__overlay').addEventListener('click', () => {
      this.closeImportModal();
    });
  }

  closeImportModal() {
    const modal = document.getElementById('import-modal');
    if (modal) {
      modal.remove();
    }
  }

  async handleFileImport(file) {
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      this.showErrorMessage('Please select a valid JSON file.');
      return;
    }

    try {
      this.showImportProgress();
      
      const fileContent = await this.readFileAsText(file);
      const importOptions = this.getImportOptions();
      
      const response = await fetch(`${this.apiBaseUrl}/import/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: fileContent,
          options: importOptions
        })
      });

      const result = await response.json();
      this.showImportResults(result);
      
    } catch (error) {
      console.error('Import error:', error);
      this.showErrorMessage('Import failed. Please check your file and try again.');
    } finally {
      this.hideImportProgress();
    }
  }

  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  getImportOptions() {
    return {
      import_workouts: document.getElementById('import-workouts').checked,
      import_nutrition: document.getElementById('import-nutrition').checked,
      import_schedules: document.getElementById('import-schedules').checked,
      import_progress: document.getElementById('import-progress').checked,
      import_social: document.getElementById('import-social').checked,
      overwrite_profile: document.getElementById('overwrite-profile').checked
    };
  }

  showImportProgress() {
    const progress = document.getElementById('import-progress');
    const results = document.getElementById('import-results');
    
    if (progress) {
      progress.style.display = 'block';
      results.style.display = 'none';
      
      // Animate progress bar
      const progressFill = progress.querySelector('.progress-fill');
      let width = 0;
      const interval = setInterval(() => {
        width += Math.random() * 10;
        if (width >= 90) {
          width = 90;
          clearInterval(interval);
        }
        progressFill.style.width = width + '%';
      }, 200);
    }
  }

  hideImportProgress() {
    const progress = document.getElementById('import-progress');
    if (progress) {
      const progressFill = progress.querySelector('.progress-fill');
      progressFill.style.width = '100%';
      
      setTimeout(() => {
        progress.style.display = 'none';
      }, 500);
    }
  }

  showImportResults(result) {
    const results = document.getElementById('import-results');
    const success = document.getElementById('import-success');
    const errors = document.getElementById('import-errors');
    const warnings = document.getElementById('import-warnings');
    
    if (results) {
      results.style.display = 'block';
      
      // Show success
      if (success) {
        success.innerHTML = `
          <strong>✅ Import Successful!</strong><br>
          Imported ${result.imported_count} records successfully.
        `;
      }
      
      // Show errors
      if (errors && result.errors.length > 0) {
        errors.innerHTML = `
          <strong>❌ Errors:</strong><br>
          ${result.errors.map(error => `• ${error}`).join('<br>')}
        `;
      }
      
      // Show warnings
      if (warnings && result.warnings.length > 0) {
        warnings.innerHTML = `
          <strong>⚠️ Warnings:</strong><br>
          ${result.warnings.map(warning => `• ${warning}`).join('<br>')}
        `;
      }
    }
  }

  showLoadingState(message) {
    const loading = document.createElement('div');
    loading.id = 'export-loading';
    loading.className = 'export-loading';
    loading.innerHTML = `
      <div class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>${message}</p>
      </div>
    `;
    loading.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    document.body.appendChild(loading);
  }

  hideLoadingState() {
    const loading = document.getElementById('export-loading');
    if (loading) {
      loading.remove();
    }
  }

  showSuccessMessage(message) {
    this.showToast(message, 'success');
  }

  showErrorMessage(message) {
    this.showToast(message, 'error');
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 5px;
      z-index: 10001;
      font-family: 'Righteous', cursive;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// Initialize data export manager
window.dataExportManager = new DataExportManager();
