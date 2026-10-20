import * as React from 'react'
import memoizeOne from 'memoize-one'

import { Branch } from '../../models/branch'
import { IRemote } from '../../models/remote'
import { Repository } from '../../models/repository'
import { Dispatcher } from '../dispatcher'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  OkCancelButtonGroup,
} from '../dialog'
import { IFilterListGroup, IFilterListItem } from '../lib/filter-list'
import { SectionFilterList } from '../lib/section-filter-list'
import { ClickSource } from '../lib/list'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { HighlightText } from '../lib/highlight-text'
import { TooltippedContent } from '../lib/tooltipped-content'
import { enableAccessibleListToolTips } from '../../lib/feature-flag'
import { Ref } from '../lib/ref'
import { IMatches } from '../../lib/fuzzy-find'
import { truncateWithEllipsis } from '../../lib/truncate-with-ellipsis'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'

const RowHeight = 30

interface IRemoteListItem extends IFilterListItem {
  readonly text: ReadonlyArray<string>
  readonly id: string
  readonly remote: IRemote
}

interface IPushToRemoteDialogProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository

  /** All the remotes of the repository */
  readonly remotes: ReadonlyArray<IRemote>

  /** The branch to push (the currently checked out branch) */
  readonly branch: Branch

  readonly onDismissed: () => void
}

interface IPushToRemoteDialogState {
  readonly filterText: string
  readonly selectedItem: IRemoteListItem | null

  /** Whether the branch should track the pushed branch from now on */
  readonly setUpstream: boolean
}

/**
 * A dialog for pushing the current branch to a remote other than the one it
 * tracks.
 */
export class PushToRemoteDialog extends React.Component<
  IPushToRemoteDialogProps,
  IPushToRemoteDialogState
> {
  private getGroups = memoizeOne(
    (
      remotes: ReadonlyArray<IRemote>,
      upstreamRemoteName: string | null
    ): ReadonlyArray<IFilterListGroup<IRemoteListItem>> => [
      {
        identifier: 'remotes',
        items: remotes
          .filter(r => r.name !== upstreamRemoteName)
          .map(remote => ({
            text: [remote.name, remote.url],
            id: remote.name,
            remote,
          })),
      },
    ]
  )

  public constructor(props: IPushToRemoteDialogProps) {
    super(props)

    const [group] = this.getGroups(
      props.remotes,
      props.branch.upstreamRemoteName
    )

    this.state = {
      filterText: '',
      selectedItem: group.items.at(0) ?? null,
      setUpstream: false,
    }
  }

  public render() {
    const { branch } = this.props
    const groups = this.getGroups(this.props.remotes, branch.upstreamRemoteName)

    return (
      <Dialog
        id="push-to-remote"
        title={
          <>
            Push <strong>{truncateWithEllipsis(branch.name, 40)}</strong> to…
          </>
        }
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <SectionFilterList<IRemoteListItem>
            className="push-remote-list"
            rowHeight={RowHeight}
            groups={groups}
            selectedItem={this.state.selectedItem}
            filterText={this.state.filterText}
            onFilterTextChanged={this.onFilterTextChanged}
            onSelectionChanged={this.onSelectionChanged}
            onItemClick={this.onItemClick}
            renderItem={this.renderItem}
            renderRowFocusTooltip={this.renderRowFocusTooltip}
            renderNoItems={this.renderNoItems}
            getItemAriaLabel={this.getItemAriaLabel}
            placeholderText="Filter remotes"
            invalidationProps={groups}
          />
          <div className="set-upstream">{this.renderSetUpstreamCheckbox()}</div>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={this.getOkButtonText()}
            okButtonDisabled={this.state.selectedItem === null}
            cancelButtonVisible={false}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private renderSetUpstreamCheckbox() {
    const { branch } = this.props
    const { selectedItem, setUpstream } = this.state
    const target =
      selectedItem === null ? (
        'the pushed branch'
      ) : (
        <Ref>
          {selectedItem.remote.name}/{branch.name}
        </Ref>
      )

    return (
      <Checkbox
        label={
          branch.upstream === null ? (
            <>Track {target} from now on</>
          ) : (
            <>
              Track {target} instead of <Ref>{branch.upstream}</Ref> from now on
            </>
          )
        }
        value={setUpstream ? CheckboxValue.On : CheckboxValue.Off}
        disabled={selectedItem === null}
        onChange={this.onSetUpstreamChanged}
      />
    )
  }

  private getOkButtonText() {
    const { selectedItem } = this.state
    return selectedItem === null
      ? 'Push'
      : `Push to ${selectedItem.remote.name}`
  }

  private renderItem = (item: IRemoteListItem, matches: IMatches) => {
    const { remote } = item
    return (
      <div className="remote-list-item">
        <Octicon className="icon" symbol={octicons.server} />
        <TooltippedContent
          className="name"
          tooltip={remote.name}
          onlyWhenOverflowed={true}
          disabled={enableAccessibleListToolTips()}
        >
          <HighlightText text={remote.name} highlight={matches.title} />
        </TooltippedContent>
        <TooltippedContent
          className="url"
          tooltip={remote.url}
          onlyWhenOverflowed={true}
          disabled={enableAccessibleListToolTips()}
        >
          <HighlightText text={remote.url} highlight={matches.subtitle} />
        </TooltippedContent>
      </div>
    )
  }

  private renderRowFocusTooltip = (item: IRemoteListItem) => {
    return `${item.remote.name}: ${item.remote.url}`
  }

  private renderNoItems = () => {
    return <div className="no-remotes">No remotes found</div>
  }

  private getItemAriaLabel = (item: IRemoteListItem) => {
    return `${item.remote.name}, ${item.remote.url}`
  }

  private onFilterTextChanged = (filterText: string) => {
    this.setState({ filterText })
  }

  private onSelectionChanged = (selectedItem: IRemoteListItem | null) => {
    this.setState({ selectedItem })
  }

  private onItemClick = (item: IRemoteListItem, source: ClickSource) => {
    if (source.kind !== 'keyboard' || source.event.key !== 'Enter') {
      return
    }

    source.event.preventDefault()
    this.setState({ selectedItem: item }, this.onSubmit)
  }

  private onSetUpstreamChanged = (event: React.FormEvent<HTMLInputElement>) => {
    this.setState({ setUpstream: event.currentTarget.checked })
  }

  private onSubmit = () => {
    const { selectedItem, setUpstream } = this.state
    if (selectedItem === null) {
      return
    }

    this.props.onDismissed()
    this.props.dispatcher.pushToRemote(
      this.props.repository,
      selectedItem.remote,
      setUpstream
    )
  }
}
