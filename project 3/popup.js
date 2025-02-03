document.getElementById('addReportAndTime').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      console.error('No active tab found');
      return;
    }

    if (!tab.url?.includes('hrm-portal.malam-payroll.com')) {
      alert('Please navigate to the HRM Portal first');
      return;
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Get Vue instance if it exists
        const getVueInstance = () => {
          // Try to find Vue instance from a known element
          const appElement = document.querySelector('#app')?.__vue__;
          if (appElement) return appElement;

          // Alternative: find any element with Vue instance
          const allElements = document.querySelectorAll('*');
          for (const el of allElements) {
            if (el.__vue__) return el.__vue__;
          }
          return null;
        };

        const clickAddReport = async () => {
          const selectors = [
            'button[aria-label="כפתור הוספת דיווח"]',
            'button.v-btn--elevated:has(span:contains("הוספת דיווח"))',
            'button.v-btn:has(i.far.fa-plus)',
            'button.button:has(span:contains("הוספת דיווח"))'
          ];

          let addButton = null;
          for (const selector of selectors) {
            try {
              addButton = document.querySelector(selector);
              if (addButton) break;
            } catch (e) {
              console.log(`Selector ${selector} failed:`, e);
            }
          }

          if (addButton) {
            console.log('Found add button, clicking...');
            addButton.click();
            return true;
          }
          console.log('Add button not found');
          return false;
        };

        const clickTimeInput = async () => {
          const selectors = [
            'input[aria-label="שדה טקסט שעת כניסה"]',
            '.time-picker input[type="text"]',
            'input.v-field__input[aria-label*="שעת כניסה"]',
            '.v-field__input[aria-label*="שעת כניסה"]'
          ];

          let timeInput = null;
          for (const selector of selectors) {
            timeInput = document.querySelector(selector);
            if (timeInput) break;
          }

          if (timeInput) {
            console.log('Found time input, clicking...');
            timeInput.click();
            timeInput.focus();
            return timeInput;
          }
          return null;
        };

        const fillTimeInput = (timeInput) => {
          if (timeInput) {
            // Inject the value '1000' into the input
            timeInput.value = '1000';

            // Trigger the 'input' event to notify Vue of the change
            const event = new Event('input', { bubbles: true });
            timeInput.dispatchEvent(event);

            // Optionally, simulate keypresses if needed
            for (const char of '1000') {
              timeInput.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
            }
            console.log('Filled time input with 1000');
          }
        };

        const performActions = async () => {
          const vue = getVueInstance();
          if (!vue || !vue.$nextTick) {
            console.log('Vue instance not found, falling back to setTimeout');
            if (await clickAddReport()) {
              setTimeout(async () => {
                const timeInput = await clickTimeInput();
                if (timeInput) {
                  fillTimeInput(timeInput);
                }
              }, 1000);
            }
            return;
          }

          // Using Vue's nextTick
          if (await clickAddReport()) {
            vue.$nextTick(() => {
              setTimeout(async () => {
                const timeInput = await clickTimeInput();
                if (timeInput) {
                  fillTimeInput(timeInput);
                }
              }, 300);
            });
          }
        };

        performActions();
      }
    });
  } catch (error) {
    console.error('Error executing script:', error);
  }
});
