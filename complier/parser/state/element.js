import { read_script } from '../read/script.js'

/**
 * 专门来处理标签的特殊情况
 * specials对象的每一项都是对象
 * key位特殊标签的名字，value也是一个对象。
 * 对象内有特殊标签的解析函数和在Parser对象的字段名称
 */
const specials = {
  script: {
    read: read_script,
    property: 'js'
  }
}

export function element(parser) {
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

  // 处理特殊标签script
  if (specials[tagName]) { 
    // 期待script后面跟着>, 否则就报错。
    parser.expect('>', true)
    const readObj = specials[tagName]
    const node = readObj.read(parser, start)
    parser[readObj.property].push(node)
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
