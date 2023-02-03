export function text(parser) {
  const start = parser.index // text节点开始的位置.

  let data = '' // 文本的内容，初始化为空字符.
  while (
    parser.index < parser.template.length && // 不能超过输入代码字符的长度.
    !parser.match('<') && // 预读一个字符，不能为'<', 注意此时不能消耗字符.
    !parser.match('{')  
    ) { 
      data += parser.template[parser.index] // 读取文本
      parser.index++ // 注意此时一定要消耗一个字符，否则进入死循环中去。 
  }

  // 此时我们已经得到文本节点的全部内容了，可以构建文本节点了。
  const node = {
    type: 'Text',
    start,
    end: start + data.length,
    raw: data
  }
  parser.current().children.push(node)
  // 不返回任何状态，使得进入默认的fragment进行重新判断。
}