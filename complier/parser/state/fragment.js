import { element } from './element.js'
import { mstancheTag } from './mustache.js'
import { text } from './text.js'

export function fragment(parser) {
  if (parser.match('<')) { 
    return element // 如果是字符'<'，通过返回element函数，使得全局变量的值变为element，从而进入解析element。
  }

  if (parser.match('{')) {
    return mstancheTag // 使状态进入mstancheTag
  }

  return text // 使状态进入text
}