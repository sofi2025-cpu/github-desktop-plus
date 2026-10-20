import * as React from 'react'
import classNames from 'classnames'
import { dragAndDropManager } from '../../lib/drag-and-drop-manager'
import { DragType } from '../../models/drag-drop'

/** Where a dragged group goes relative to the group owning the drop zone */
export type RepositoryGroupDropPosition = 'before' | 'after'

interface IRepositoryGroupDropZoneProps {
  /** The key of the group the dragged group is dropped next to */
  readonly groupKey: string

  /**
   * Whether the zone sits at the top of the group's header (dropping before the
   * group) or at the bottom of the group's last row (dropping after it).
   */
  readonly position: RepositoryGroupDropPosition

  /**
   * Whether to draw the insertion indicator. It's up to the list, since two
   * zones on adjacent rows share each boundary between groups and it must be
   * drawn at the same place whichever of them is hovered.
   */
  readonly showIndicator: boolean

  readonly onMouseEnter: (
    groupKey: string,
    position: RepositoryGroupDropPosition
  ) => void

  /** Also called if the zone unmounts while hovered */
  readonly onMouseLeave: (
    groupKey: string,
    position: RepositoryGroupDropPosition
  ) => void

  readonly onDrop: (
    targetGroupKey: string,
    position: RepositoryGroupDropPosition
  ) => void
}

/**
 * An area at the edge of a repository list row where a dragged repository
 * group can be dropped, which can show the same insertion indicator as the
 * lists that support reordering. Only meant to be rendered while a group is
 * being dragged, as it covers part of the row and would get in the way of
 * clicks.
 */
export class RepositoryGroupDropZone extends React.Component<IRepositoryGroupDropZoneProps> {
  private isHovered = false

  public componentWillUnmount() {
    // A virtualized row can unmount under the mouse without a mouseleave
    if (this.isHovered) {
      this.isHovered = false
      this.props.onMouseLeave(this.props.groupKey, this.props.position)
    }
  }

  private isGroupDragInProgress() {
    return dragAndDropManager.isDragOfTypeInProgress(DragType.RepositoryGroup)
  }

  private onMouseEnter = () => {
    if (this.isGroupDragInProgress()) {
      this.isHovered = true
      this.props.onMouseEnter(this.props.groupKey, this.props.position)
    }
  }

  private onMouseLeave = () => {
    this.isHovered = false
    this.props.onMouseLeave(this.props.groupKey, this.props.position)
  }

  private onMouseUp = () => {
    if (this.isHovered && this.isGroupDragInProgress()) {
      this.props.onDrop(this.props.groupKey, this.props.position)
    }
    this.onMouseLeave()
  }

  private renderInsertionIndicator() {
    const isTop = this.props.position === 'before'
    const classes = classNames(
      'list-item-insertion-indicator',
      'repository-group-insertion-indicator',
      { top: isTop, bottom: !isTop }
    )

    return (
      <>
        <div className={`${classes} darwin-circle`} aria-hidden="true" />
        <div className={`${classes} darwin-line`} aria-hidden="true" />
      </>
    )
  }

  public render() {
    const isTop = this.props.position === 'before'

    return (
      <>
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- mouse-only drop target, the group header context menu offers the keyboard alternative */}
        <div
          className={classNames('list-insertion-point', {
            top: isTop,
            bottom: !isTop,
          })}
          onMouseEnter={this.onMouseEnter}
          onMouseLeave={this.onMouseLeave}
          onMouseUp={this.onMouseUp}
        />
        {this.props.showIndicator && this.renderInsertionIndicator()}
      </>
    )
  }
}
