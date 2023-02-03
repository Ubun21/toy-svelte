import * as code_red from 'code-red'

const regex_not_newline_character = /[^\n]/g
const regex_closing_script_tag = /<\/script\s*>/
/**
 * 
 * @param {} parser 
 * @param {script标签开始的位置} start 
 */
export function read_script(parser, start) {
  const scriptStart = parser.index // 保存代码开始的位置。
  const data = parser.read_util(regex_closing_script_tag) // 读取script内的代码。
  if (parser.index > parser.template.length) {
    throw Error('超出代码字符串的长度')
  }

  // 保留代码字符串开始到script标签开始之间的/n换行符,具体作用以后再解释。
  const source = parser.template.slice(0, scriptStart).replace(regex_not_newline_character, ' ') + data
  let ast
  try {
    ast = parse(source)
  } catch (error) {
    throw Error(error)
  }

  // 消耗</script>
  parser.expect(regex_closing_script_tag, true)

  const node = {
    type: 'Script',
    start,
    end: parser.index,
    content: ast
  }

  return node
}

function parse(code) {
  return code_red.parse(code, {
    sourceType: 'module',
    ecmaVersion: 12,
    locations: true
  })
}
