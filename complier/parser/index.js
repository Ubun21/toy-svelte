import { fragment } from './state/fragment.js'

let state = fragment
const regex_whitespace = /\s/

class Parser{
  index = 0 // 代码字符串的下标
  stack = []
  js = []
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
    if (this.index > this.template.length) {
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
    if (this.index > this.template.length) {
      throw Error('超过代码字符串长度')
    }
    const result = c instanceof RegExp ? c.exec(this.template.slice(this.index))
      : null
    if (result && result.index === 0) { // 匹配成功，并且是在字符串开头开始匹配
      this.index += result[0].length - 1 // 消耗匹配的字符长度
      return true
    }
    if (c === this.template[this.index]) {
      this.index++
      return true
    }
    if (require) {
      throw Error(`消耗字符或者reg失败`)
    }
    return false
  }
}

const str = `
<script>
let count = 0
</script>
<button>{count}</button>
`
const parser = new Parser(str)
console.info(parser.js)