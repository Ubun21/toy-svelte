const regex_whitespace = /\s/

let state = fragment
class Parser{
  index = 0 // 代码字符串的下标
  stack = []
  constructor(template) {
    this.template = template

    this.html = {
      type: 'Fragment',
      start: 0,
      end: template.length,
      children: []
    }

    this.stack.push(this.html)
    while (this.index < this.template.length) {
      state = state(this) || fragment
    }
  }
  current() {
    return this.stack[this.stack.length - 1]
  }
  match(c) {
    return this.template[this.index] === c
  }
  read_util(pattern) {
    if (this.index > this.template.index) {
      throw Error('超出了template的长度了')
    }
    const start = this.index
    const match = pattern.exec(this.template.slice(start))
    if (match) {
      // 消耗的字符为匹配的长度加上初始长度
      this.index = start + match.index
      return this.template.slice(start, this.index)
    }
    // 不匹配情况，直接消耗完整个字符串，提前退出循环
    this.index = this.template.length
    return this.template.slice(start)
  }
  skip_white_space() {
    while (
      this.index < this.template.length &&
      regex_whitespace.test(this.template[this.index])
    ) {
      this.index++
    }
  }
  expect(c, require) {
    if (
      this.index < this.template.length &&
      c === this.template[this.index]
    ) {
      this.index++
      return true
    }
    if (require) {
      throw Error(`期待字符${c},但是却是字符${this.template[this.index]}`)
    }
    return false
  }
}

function fragment(parser) {
  if (parser.match('<')) { 
    return element // 如果是字符'<'，通过返回element函数，使得全局变量的值变为element，从而进入解析element。
  }

  if (parser.match('{')) {
    return mstancheTag // 使状态进入mstancheTag
  }

  return text // 使状态进入text
}
function element(parser) {
  // fragment函数没有消耗<,因此此时我们要消耗掉字符<
  const start = parser.index++
  const parent = parser.current() // 拿到栈顶元素
  
  // <字符后面跟着是字符/情况下，j解析到了标签的关闭部分，比如 </button>
  const is_closing_tag = parser.expect('/') // 
  const tagName = readTagName(parser)

  // 构建element元素
  const element = {
    type: 'Element',
    start,
    name: tagName,
    end: null, // 以后再填充
    children: [],
    attribute: []
  }
  
  if (is_closing_tag) {
    // 关闭标签，解析完名字之后就剩字符'>'
    // 例如</button>名字button解析之后,后面应该跟>，否则就报错。
    parser.expect('>', true)
    if (
      parent.type !== element.type ||
      parent.name !== element.name
    ) {
      throw Error('标签没有正确关闭')
    }
    parent.end = parser.index
    parser.stack.pop() // 此时一对标签已经正确解析了
    return
  }
  
  parser.current().children.push(element)
  // 如果不是关闭标签，解析完名字之后，我们要看一下是否是自关闭标签。
  parser.skip_white_space()
  const self_close = parser.expect('/')
  parser.expect('>', true)
  if (self_close) {
    element.end = parser.index
  } else {
    parser.stack.push(element)
  }
}
const regex_whitespace_or_slash_or_closing_tag = /(\s|\/|>)/
function readTagName(parser) {
  /**
   * 读取名字中断在三种情况。
   * 1. 碰到空格，这种情况有可能name后面有attribute，或者直接结束。
   * 2. 名字后面直接是字符'/',是自闭标签。
   * 3. 名字后面直接跟字符'>',说明标签的开始部分已经结束了。
   */
  const name = parser.read_util(regex_whitespace_or_slash_or_closing_tag)
  return name
}
function text(parser) {
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
function mstancheTag(parser) {
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

console.info('test unit 1')
const test1 = '<button>hello {name}</button>'
const parser = new Parser(test1)
console.info(parser.html.type === 'Fragment')
console.info(parser.html.children.length === 1)
console.info(parser.html.children[0].type === 'Element')
console.info(parser.html.children[0].name === 'button')
const children = parser.html.children[0].children
console.info(children.length === 2)
console.info(children[0].type === 'Text')
console.info(children[0].raw === 'hello ')
console.info(children[1].type === 'MstancheTag')
console.info(children[1].expression === 'name')

console.info('test unit 2')
const test2 = '<p><button>test</button></p>'
const parser2 = new Parser(test2)
console.info(parser2.html.children.length === 1)
console.info(parser2.html.children[0].type === 'Element')
console.info(parser2.html.children[0].name === 'p')
console.info(parser2.html.children[0].children[0].type === 'Element')
console.info(parser2.html.children[0].children[0].name === 'button')
console.info(parser2.html.children[0].children[0].children[0].type === 'Text')
console.info(parser2.html.children[0].children[0].children[0].raw === 'test')
