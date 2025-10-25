// craco.config.js
const path = require("path");
require("dotenv").config();

// Environment variable overrides
const config = {
  disableHotReload: process.env.DISABLE_HOT_RELOAD === "true",
  enableVisualEdits: process.env.REACT_APP_ENABLE_VISUAL_EDITS === "true",
  enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === "true",
};

// Conditionally load visual editing modules only if enabled
let babelMetadataPlugin;
let setupDevServer;

if (config.enableVisualEdits) {
  babelMetadataPlugin = require("./plugins/visual-edits/babel-metadata-plugin");
  setupDevServer = require("./plugins/visual-edits/dev-server-setup");
}

// Conditionally load health check modules only if enabled
let WebpackHealthPlugin;
let setupHealthEndpoints;
let healthPluginInstance;

if (config.enableHealthCheck) {
  WebpackHealthPlugin = require("./plugins/health-check/webpack-health-plugin");
  setupHealthEndpoints = require("./plugins/health-check/health-endpoints");
  healthPluginInstance = new WebpackHealthPlugin();
}

const webpackConfig = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {

      // Disable hot reload completely if environment variable is set
      if (config.disableHotReload) {
        // Remove hot reload related plugins
        webpackConfig.plugins = webpackConfig.plugins.filter(plugin => {
          return !(plugin.constructor.name === 'HotModuleReplacementPlugin');
        });

        // Disable watch mode
        webpackConfig.watch = false;
        webpackConfig.watchOptions = {
          ignored: /.*/, // Ignore all files
        };
      } else {
        // Add ignored patterns to reduce watched directories
        webpackConfig.watchOptions = {
          ...webpackConfig.watchOptions,
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/build/**',
            '**/dist/**',
            '**/coverage/**',
            '**/public/**',
          ],
        };
      }

      // Configure source map loader to ignore missing source maps
      const sourceMapLoader = webpackConfig.module.rules.find(
        rule => rule.use && rule.use.some && rule.use.some(use => 
          use.loader && use.loader.includes('source-map-loader')
        )
      );

      if (sourceMapLoader) {
        sourceMapLoader.use.forEach(use => {
          if (use.loader && use.loader.includes('source-map-loader')) {
            use.options = {
              ...use.options,
              filterSourceMappingUrl: (url, resourcePath) => {
                // Ignore source map warnings for lucide-react and other problematic packages
                if (resourcePath.includes('lucide-react') || 
                    resourcePath.includes('node_modules')) {
                  return false;
                }
                return true;
              },
            };
          }
        });
      }

      // Alternative approach: Add a custom plugin to suppress source map warnings
      const SuppressSourceMapWarningsPlugin = {
        apply: (compiler) => {
          compiler.hooks.compilation.tap('SuppressSourceMapWarningsPlugin', (compilation) => {
            compilation.hooks.buildModule.tap('SuppressSourceMapWarningsPlugin', (module) => {
              if (module.resource && module.resource.includes('lucide-react')) {
                module.warnings = module.warnings || [];
                module.warnings = module.warnings.filter(warning => 
                  !warning.message || !warning.message.includes('Failed to parse source map')
                );
              }
            });
          });
        }
      };

      webpackConfig.plugins.push(SuppressSourceMapWarningsPlugin);

      // Additional approach: Configure webpack to ignore source map errors
      webpackConfig.ignoreWarnings = [
        /Failed to parse source map/,
        /source-map-loader/,
      ];

      // Add health check plugin to webpack if enabled
      if (config.enableHealthCheck && healthPluginInstance) {
        webpackConfig.plugins.push(healthPluginInstance);
      }

      return webpackConfig;
    },
  },
};

// Only add babel plugin if visual editing is enabled
if (config.enableVisualEdits) {
  webpackConfig.babel = {
    plugins: [babelMetadataPlugin],
  };
}

// Setup dev server with visual edits and/or health check
if (config.enableVisualEdits || config.enableHealthCheck) {
  webpackConfig.devServer = (devServerConfig) => {
    // Apply visual edits dev server setup if enabled
    if (config.enableVisualEdits && setupDevServer) {
      devServerConfig = setupDevServer(devServerConfig);
    }

    // Add health check endpoints if enabled
    if (config.enableHealthCheck && setupHealthEndpoints && healthPluginInstance) {
      const originalSetupMiddlewares = devServerConfig.setupMiddlewares;

      devServerConfig.setupMiddlewares = (middlewares, devServer) => {
        // Call original setup if exists
        if (originalSetupMiddlewares) {
          middlewares = originalSetupMiddlewares(middlewares, devServer);
        }

        // Setup health endpoints
        setupHealthEndpoints(devServer, healthPluginInstance);

        return middlewares;
      };
    }

    return devServerConfig;
  };
}

module.exports = webpackConfig;
