/*
 * domhelper
 * http://github.com/yawetse/domhelper
 *
 * Copyright (c) 2014 Yaw Joseph Etse. All rights reserved.
 */
'use strict';
var path = require('path');

module.exports = function(grunt) {
  grunt.initConfig({
    jsbeautifier: {
      files: ['<%= jshint.all %>'],
      options: {
        'indent_size': 2,
        'indent_char': ' ',
        'indent_level': 0,
        'indent_with_tabs': false,
        'preserve_newlines': true,
        'max_preserve_newlines': 10,
        'brace_style': 'collapse',
        'keep_array_indentation': false,
        'keep_function_indentation': false,
        'space_before_conditional': true,
        'eval_code': false,
        'indent_case': false,
        'unescape_strings': false,
        'space_after_anon_function': true
      }
    },
    simplemocha: {
      options: {
        globals: ['should'],
        timeout: 3000,
        ignoreLeaks: false,
        ui: 'bdd',
        reporter: 'spec'
      },
      all: {
        src: 'test/**/*.js'
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: [
        'Gruntfile.js',
        'index.js',
        'contoller/**/*.js',
        'resources/**/*.js',
        'test/**/*.js',
      ]
    },
    jsdoc : {
        dist : {
            src: ['lib/*.js', 'test/*.js'],
            options: {
                destination: 'doc/html',
                configure: 'jsdoc.json'
            }
        }
    },
    browserify: {
      dist: {
        files: [{
          expand: true,
          cwd: 'resources',
          src: ['**/*_src.js'],
          dest: 'public',
          rename: function (dest, src) {
            var finallocation = path.join(dest, src);
            finallocation = finallocation.replace('_src', '_build');
            finallocation = finallocation.replace('resources', 'public');
            finallocation = path.resolve(finallocation);
            return finallocation;
          }
        }],
        options: {}
      }
    },
    uglify: {
      options: {
        sourceMap: true,
        compress: {
          drop_console: false
        }
      },
      all: {
        files: [{
          expand: true,
          cwd: 'public',
          src: ['**/*_build.js'],
          dest: 'public',
          rename: function (dest, src) {
            var finallocation = path.join(dest, src);
            finallocation = finallocation.replace('_build', '.min');
            finallocation = path.resolve(finallocation);
            return finallocation;
          }
        }]
      }
    },
    watch: {
      scripts: {
        // files: '**/*.js',
        files: [
          'Gruntfile.js',
          'index.js',
          'contoller/**/*.js',
          'resources/**/*.js',
          'test/**/*.js',
        ],
        tasks: ['lint','browserify','jsbeautifier','uglify',/*'doc',*/ 'test'],
        options: {
          interrupt: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-jsbeautifier');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-uglify');
  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.registerTask('default', ['jshint', 'jsbeautifier', 'simplemocha']);
  grunt.registerTask('lint', 'jshint');
  grunt.registerTask('doc','jsdoc');
  grunt.registerTask('test', 'simplemocha');
};
