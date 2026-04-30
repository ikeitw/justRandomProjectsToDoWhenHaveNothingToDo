import axios from 'axios';
import config from '../config.js';
import { logger } from '../utils/logger.js';

/**
 * GitHub Models API Service
 *
 * Handles all communication with the GitHub Models API.
 * Docs: https://docs.github.com/en/github-models/prototyping-with-ai-models
 */

class GitHubModelsProvider {
  constructor() {
    this.endpoint = config.githubModelsEndpoint;
    this.model = config.githubModel;
    this.token = config.githubModelsToken;
  }

  /**
   * Call GitHub Models chat completions endpoint
   *
   * @param {string} userMessage - User's message/prompt
   * @param {string} [systemMessage] - Optional system message for context
   * @returns {Promise<{model: string, output_text: string, raw: object}>}
   */
  async chat(userMessage, systemMessage = null) {
    // Validate inputs
    if (!userMessage || typeof userMessage !== 'string') {
      throw new Error('userMessage must be a non-empty string');
    }

    if (userMessage.trim().length === 0) {
      throw new Error('userMessage cannot be empty');
    }

    if (userMessage.length > 32000) {
      throw new Error('userMessage exceeds 32000 character limit');
    }

    // Build messages array
    const messages = [];

    if (systemMessage && typeof systemMessage === 'string' && systemMessage.trim().length > 0) {
      messages.push({
        role: 'system',
        content: systemMessage.substring(0, 32000),
      });
    }

    messages.push({
      role: 'user',
      content: userMessage,
    });

    // Prepare request
    const requestBody = {
      model: this.model,
      messages,
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 4096,
    };

    try {
      logger.info('Calling GitHub Models API', {
        model: this.model,
        messageCount: messages.length,
      });

      const response = await axios.post(this.endpoint, requestBody, {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${this.token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 seconds
      });

      const data = response.data;

      // Extract text from response
      let outputText = '';
      if (data.choices && data.choices[0] && data.choices[0].message) {
        outputText = data.choices[0].message.content || '';
      }

      logger.info('GitHub Models API call successful', {
        model: this.model,
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      });

      return {
        model: this.model,
        output_text: outputText,
        raw: {
          usage: data.usage,
          finish_reason: data.choices?.[0]?.finish_reason,
        },
      };
    } catch (error) {
      if (error.response) {
        // API returned an error
        const status = error.response.status;
        const errorData = error.response.data;

        logger.error('GitHub Models API error', {
          status,
          error: errorData.message || errorData.error || 'Unknown error',
        });

        if (status === 401) {
          throw new Error('Authentication failed: invalid or expired GitHub token');
        } else if (status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (status === 503) {
          throw new Error('GitHub Models service is temporarily unavailable');
        } else {
          throw new Error(`GitHub Models API error (${status}): ${errorData.message || 'Unknown'}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        logger.error('GitHub Models request timeout');
        throw new Error('Request to GitHub Models timed out (60s)');
      } else {
        logger.error('Network error calling GitHub Models', {
          message: error.message,
        });
        throw new Error(`Network error: ${error.message}`);
      }
    }
  }

  /**
   * Health check: verify API connectivity
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      await this.chat('ping', 'Respond with "pong" only.');
      return true;
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      return false;
    }
  }
}

export default new GitHubModelsProvider();

