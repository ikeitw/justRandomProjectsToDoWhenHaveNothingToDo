import dotenv from 'dotenv';

dotenv.config();

const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  // Authentication
  appBearerToken: process.env.APP_BEARER_TOKEN || 'change_this_to_a_long_random_secret',

  // GitHub Models API
  githubModelsToken: process.env.GITHUB_MODELS_TOKEN || '',
  githubModelsEndpoint:
    process.env.GITHUB_MODELS_ENDPOINT || 'https://models.github.ai/inference/chat/completions',
  githubModel: process.env.GITHUB_MODEL || 'openai/gpt-4.1',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  hideTokensInLogs: process.env.HIDE_TOKENS_IN_LOGS !== 'false',
};

// Validate critical config
function validateConfig() {
  const errors = [];

  if (!config.appBearerToken || config.appBearerToken === 'change_this_to_a_long_random_secret') {
    errors.push('APP_BEARER_TOKEN is not configured or is using default value');
  }

  if (!config.githubModelsToken) {
    errors.push('GITHUB_MODELS_TOKEN is not set');
  }

  if (errors.length > 0 && !config.isDev) {
    console.error('❌ Configuration errors:');
    errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }

  if (errors.length > 0) {
    console.warn('⚠️  Configuration warnings (development mode):');
    errors.forEach((err) => console.warn(`  - ${err}`));
  }
}

validateConfig();

export default config;

