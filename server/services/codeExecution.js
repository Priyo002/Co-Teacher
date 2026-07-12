// server/services/codeExecution.js

const JDOODLE_API_URL = 'https://api.jdoodle.com/v1/execute';

// Maps our internal languages to JDoodle's format (language, versionIndex)
const LANGUAGE_MAP = {
  'python': { language: 'python3', versionIndex: '3' },
  'javascript': { language: 'nodejs', versionIndex: '4' },
  'java': { language: 'java', versionIndex: '4' },
  'c': { language: 'c', versionIndex: '5' },
  'cpp': { language: 'cpp', versionIndex: '5' }
};

async function executeCode(language, code) {
  const langConfig = LANGUAGE_MAP[language.toLowerCase()];
  
  if (!langConfig) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const clientId = process.env.JDOODLE_CLIENT_ID;
  const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('JDoodle API credentials are missing from environment variables.');
  }

  try {
    const response = await fetch(JDOODLE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clientId: clientId,
        clientSecret: clientSecret,
        script: code,
        language: langConfig.language,
        versionIndex: langConfig.versionIndex
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('JDoodle API Error Response:', data);
      throw new Error(data.error || 'Failed to execute code via JDoodle API.');
    }

    // JDoodle returns: { output, statusCode, memory, cpuTime, error, compilationStatus }
    // We map it to our UI's expected format.
    
    // Status Code 200 = Success. 
    // Usually compilation errors or runtime errors show up in output or compilationStatus.
    
    let isError = false;
    let finalStatus = 'Success';
    let stderr = '';
    let stdout = data.output;
    let compile_output = '';

    // If JDoodle explicitly returned an error property or non-200 status
    if (data.error || data.statusCode !== 200) {
        isError = true;
        finalStatus = 'Error';
    }

    // JDoodle bundles compile errors into output or compilationStatus
    if (data.output && data.output.toLowerCase().includes('error:')) {
        isError = true;
        finalStatus = 'Error';
        stderr = data.output; 
        stdout = ''; // It was an error, not standard output
    }

    return {
      stdout: stdout,
      stderr: stderr,
      compile_output: compile_output,
      status: finalStatus,
      isError: isError,
      time: data.cpuTime || null,
      memory: data.memory || null
    };

  } catch (error) {
    console.error('Code Execution Service Error:', error);
    return {
      stdout: '',
      stderr: error.message,
      compile_output: '',
      status: 'Error',
      isError: true
    };
  }
}

module.exports = { executeCode };
