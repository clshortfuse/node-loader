/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/

const { getOptions, interpolateName } = require('loader-utils');
const { validate } = require('schema-utils');
const { createHash } = require('crypto');

const schema = require('./options.json');

module.exports.default = function loader(content) {
  const options = getOptions(this);

  validate(schema, options, {
    name: 'Node Loader',
    baseDataPath: 'options',
  });

  const name = interpolateName(
    this,
    typeof options.name !== 'undefined' ? options.name : '[contenthash].[ext]',
    {
      context: this.rootContext,
      content,
    }
  );
  const base64Content = content.toString('base64');
  const hash = createHash('md4').update(content).digest().toString('hex');
  return `
  const name = __dirname + '/' + ${JSON.stringify(name)};
  const hash = ${JSON.stringify(hash)};
  if (!__non_webpack_require__('fs').existsSync(name) 
    || __non_webpack_require__('crypto').createHash('md4').update(__non_webpack_require__('fs').readFileSync(name)).digest().toString('hex') !== hash) {
      __non_webpack_require__('fs').writeFileSync(name, ${JSON.stringify(base64Content)}, {encoding: 'base64'});
  }
  try {
    process.dlopen(module, name${typeof options.flags !== 'undefined' ? `, ${JSON.stringify(options.flags)}` : ''});
  } catch (error) {
    throw new Error('node-loader:\\n' + error);
  }
`;
}

module.exports.raw = true;
