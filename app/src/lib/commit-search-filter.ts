import { Commit } from '../models/commit'

export const AuthorFilterPrefix = 'author:'

export interface ICommitSearchFilter {
  readonly queryTextLowercase: string
  readonly authorEmailsLowercase: ReadonlySet<string>
}

const emptyAuthorEmails: ReadonlySet<string> = new Set()

/**
 * Split a raw commit search query into its 'author:' terms and the free text
 * left over.
 */
export function parseCommitSearchFilter(query: string): ICommitSearchFilter {
  const lowercaseQuery = query.toLowerCase()
  if (!lowercaseQuery.includes(AuthorFilterPrefix)) {
    return {
      queryTextLowercase: lowercaseQuery,
      authorEmailsLowercase: emptyAuthorEmails,
    }
  }

  const authorEmails = new Set<string>()
  const textTerms = new Array<string>()

  for (const term of lowercaseQuery.split(/\s+/)) {
    if (term.startsWith(AuthorFilterPrefix)) {
      const email = term.substring(AuthorFilterPrefix.length)

      if (email.length === 0) {
        textTerms.push(term)
      } else {
        authorEmails.add(email)
      }
    } else if (term.length > 0) {
      textTerms.push(term)
    }
  }

  return {
    queryTextLowercase: textTerms.join(' '),
    authorEmailsLowercase: authorEmails,
  }
}

/** Whether the filter places no restriction at all on the commits shown. */
export function isCommitSearchFilterEmpty(filter: ICommitSearchFilter) {
  return (
    filter.queryTextLowercase.length === 0 &&
    filter.authorEmailsLowercase.size === 0
  )
}

/** Whether the given commit should be included in the results of the filter. */
export function commitMatchesSearchFilter(
  commit: Commit | undefined,
  filter: ICommitSearchFilter
): boolean {
  if (commit === undefined) {
    return false
  }

  const { queryTextLowercase: queryText, authorEmailsLowercase: authorEmails } =
    filter

  if (
    authorEmails.size > 0 &&
    !authorEmails.has(commit.author.email.toLowerCase())
  ) {
    return false
  }

  return (
    queryText.length === 0 ||
    commit.summary.toLowerCase().includes(queryText) ||
    commit.body.toLowerCase().includes(queryText) ||
    commit.tags.some(tag => tag.toLowerCase().startsWith(queryText)) ||
    commit.sha.toLowerCase().startsWith(queryText)
  )
}

/**
 * Whether re-running 'next' over the results of 'prev' yields the same answer
 * as re-running it over every commit.
 */
export function canNarrowExistingResults(prev: string, next: string) {
  if (!next.startsWith(prev)) {
    return false
  }

  const prevEmails = parseCommitSearchFilter(prev).authorEmailsLowercase
  const nextEmails = parseCommitSearchFilter(next).authorEmailsLowercase
  return (
    prevEmails.size === nextEmails.size &&
    [...prevEmails].every(email => nextEmails.has(email))
  )
}
