import { AuthorFilterPrefix } from '../../lib/commit-search-filter'

export type TAuthorTokenState = 'valid' | 'invalid' | 'pending'

export type TFilterToken =
  | { kind: 'query'; value: string; start: number; end: number }
  | {
      kind: 'author'
      name: string
      delimiter: string
      value: string
      start: number
      end: number
      state: TAuthorTokenState
      isEdited: boolean
    }

const AuthorTokenRegExp = `(?:^|\\s)${AuthorFilterPrefix}(\\S*)`

export const tokenValueClassNames: Record<TAuthorTokenState, string> = {
  valid: 'token-value',
  invalid: 'token-value-invalid',
  pending: 'token-value-pending',
}

export function parseFilterTokens(
  text: string,
  emailSet: ReadonlySet<string>,
  caretOffset: number | null
): ReadonlyArray<TFilterToken> {
  const tokens: Array<TFilterToken> = []

  const regex = new RegExp(AuthorTokenRegExp, 'gi')

  let cursor = 0
  let match: RegExpExecArray | null = null

  while ((match = regex.exec(text)) !== null) {
    const tokenEnd = match.index + match[0].length
    const [, value] = match
    const tokenStart = tokenEnd - value.length - AuthorFilterPrefix.length

    if (tokenStart > cursor) {
      tokens.push({
        kind: 'query',
        value: text.substring(cursor, tokenStart),
        start: cursor,
        end: tokenStart,
      })
    }

    const isEdited = caretOffset !== null && tokenEnd === caretOffset
    const isLastToken = regex.lastIndex === text.length

    let state: TAuthorTokenState

    if (isEdited && !isLastToken) {
      state = 'pending'
    } else if (emailSet.has(value.toLowerCase())) {
      state = 'valid'
    } else if (isLastToken) {
      state = 'pending'
    } else {
      state = 'invalid'
    }

    tokens.push({
      kind: 'author',
      name: 'author',
      delimiter: ':',
      value,
      start: tokenStart,
      end: tokenEnd,
      state,
      isEdited,
    })

    cursor = tokenEnd
  }

  if (cursor < text.length) {
    tokens.push({
      kind: 'query',
      value: text.substring(cursor),
      start: cursor,
      end: text.length,
    })
  }

  return tokens
}
