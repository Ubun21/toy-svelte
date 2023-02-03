export function mstancheTag(parser) {
  // 同理先消耗字符'{'
  const start = parser.index++
  parser.skip_white_space()
  const expression = readExpression(parser)
  parser.skip_white_space()
  parser.expect('}')
  const node = {
    type: 'MstancheTag',
    start,
    end: parser.index,
    expression
  }
  parser.current().children.push(node)
}
// 暂时先{}中的内容当做字符串来处理，实际中间的内容是表达式
function readExpression(parser) {
  let data = ''
  while (
    parser.index < parser.template.length &&
    parser.template[parser.index] !== '}'
  ) {
    data += parser.template[parser.index++]
  }
  return data
} 