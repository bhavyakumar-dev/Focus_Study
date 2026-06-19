import prettier from 'prettier/standalone';
import * as babelPlugin from 'prettier/plugins/babel';
import * as estreePlugin from 'prettier/plugins/estree';

export const formatCode = async (code, language) => {
  if (language !== 'javascript' && language !== 'typescript' && language !== 'json') {
    return code; // Fallback to raw code for unsupported languages right now
  }
  
  try {
    const formatted = await prettier.format(code, {
      parser: language === 'json' ? 'json' : 'babel',
      plugins: [babelPlugin, estreePlugin],
      singleQuote: true,
      semi: true,
      trailingComma: 'es5',
      tabWidth: 2,
    });
    return formatted;
  } catch (err) {
    console.error("Formatting failed", err);
    return code;
  }
};
