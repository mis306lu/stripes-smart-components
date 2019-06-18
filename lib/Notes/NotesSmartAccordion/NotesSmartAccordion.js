import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  get,
  pick,
} from 'lodash';
import { withRouter } from 'react-router-dom';

import {
  stripesConnect,
  IfPermission
} from '@folio/stripes-core';

import {
  sortOrders,
  notesStatuses,
  assigningModalColumnsConfig,
} from '../constants';
import NotesAccordion from '../components/NotesAccordion';

import { getQueryParams } from './utils';

const { ASC } = sortOrders;

const {
  ASSIGNED,
  UNASSIGNED,
} = notesStatuses;

const LIMIT = '20';
const PATH = 'note-links/domain/!{domainName}/type/!{entityType}/id/!{entityId}';

@stripesConnect
class NotesSmartAccordion extends Component {
  static propTypes = {
    domainName: PropTypes.string.isRequired, // eslint-disable-line react/no-unused-prop-types
    entityId: PropTypes.string.isRequired,
    entityName: PropTypes.string.isRequired,
    entityType: PropTypes.string.isRequired,
    history: PropTypes.object.isRequired,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    mutator: PropTypes.object.isRequired,
    onToggle: PropTypes.func.isRequired,
    open: PropTypes.bool,
    pathToNoteCreate: PropTypes.string.isRequired,
    pathToNoteDetails: PropTypes.string.isRequired,
    stripes: PropTypes.shape({
      hasPerm: PropTypes.func.isRequired,
    }).isRequired,
  }

  static manifest = Object.freeze({
    assignedNotes: {
      type: 'okapi',
      accumulate: true,
      path: PATH,
      GET: {
        params: {
          status: ASSIGNED,
          limit: LIMIT,
        }
      },
    },
    domainNotes: {
      type: 'okapi',
      accumulate: true,
      fetch: false,
      GET: {
        limit: LIMIT,
        path: PATH,
      },
      PUT: {
        path: 'note-links/type/!{entityType}/id/!{entityId}',
      },
    }
  });

  state = {
    sortParams: {
      order: ASC,
      by: assigningModalColumnsConfig.names.TITLE,
    }
  };

  componentDidMount() {
    if (this.props.stripes.hasPerm('ui-notes.item.view')) {
      this.props.mutator.assignedNotes.GET();
    }
  }

  getAssignedNotes = () => {
    const lastRequestIndex = get(this.props, 'resources.assignedNotes.records.length', 1) - 1;
    const items = get(this.props, `resources.assignedNotes.records[${lastRequestIndex}].notes`, [])
      .map((assignedNote) => {
        const id = get(assignedNote, 'id');
        const title = get(assignedNote, 'title');
        const updatedDate = get(assignedNote, 'metadata.updatedDate');
        const updaterPropertyName = get(assignedNote, 'updater') ? 'updater' : 'creator';
        const firstName = get(assignedNote, `${updaterPropertyName}.firstName`);
        const lastName = get(assignedNote, `${updaterPropertyName}.lastName`);

        return {
          id,
          lastSavedDate: updatedDate,
          lastSavedUserFullName: `${lastName} ${firstName}`,
          title,
        };
      });

    return {
      items,
      loading: get(this.props, 'resources.assignedNotes.isPending'),
    };
  }

  getDomainNotes = () => {
    const {
      entityType,
      entityId,
    } = this.props;

    const {
      sortParams,
    } = this.state;

    const items = get(this.props, 'resources.domainNotes.records', [])
      .reduce((acc, notesObj) => {
        acc.push(...notesObj.notes);
        return acc;
      }, [])
      .map((domainNote) => {
        const isAssigned = get(domainNote, 'links')
          .find(({ type, id }) => type === entityType && id === entityId);
        const status = isAssigned ? ASSIGNED : UNASSIGNED;

        return {
          ...pick(domainNote, ['id', 'title']),
          status,
          linksNumber: domainNote.links.length,
        };
      });

    return {
      items,
      sortParams,
      loading: get(this.props, 'resources.domainNotes.isPending'),
      totalCount: get(this.props, 'resources.domainNotes.records[0].totalRecords')
    };
  }

  fetchDomainNotes = (params) => {
    const { sortParams } = this.state;

    this.props.mutator.domainNotes.GET({
      params: {
        ...getQueryParams({
          ...params,
          sortParams,
          limit: LIMIT,
        }),
      }
    });
  }

  onSortDomainNotes = ({ sortParams, query, selectedStatusFilters }) => {
    this.setState({ sortParams }, () => {
      this.props.mutator.domainNotes.reset();
      this.fetchDomainNotes({ query, selectedStatusFilters });
    });
  }

  onSaveAssigningResults = (noteIdToStatusMap) => {
    const notes = [];

    noteIdToStatusMap.forEach((status, id) => {
      notes.push({
        id,
        status: status.toUpperCase(),
      });
    });

    this.props.mutator.domainNotes
      .PUT({ notes })
      .then(() => {
        this.props.mutator.assignedNotes.GET();
      });
  }

  onSearch = ({ query = '', selectedStatusFilters = [] }) => {
    this.props.mutator.domainNotes.reset();

    if (query === '' && selectedStatusFilters.length === 0) {
      return;
    }

    this.fetchDomainNotes({ query, selectedStatusFilters });
  }

  onNoteCreateButtonClick = () => {
    const {
      pathToNoteCreate,
      entityName,
      entityType,
      entityId,
      history,
    } = this.props;

    history.push({
      pathname: pathToNoteCreate,
      state: {
        entityName,
        entityType,
        entityId,
      },
    });
  }

  onAssignedNoteClick = (event, note) => {
    const {
      history,
      pathToNoteDetails,
      entityName,
      entityType,
      entityId,
    } = this.props;

    history.push({
      pathname: `${pathToNoteDetails}/${note.id}`,
      state: {
        entityName,
        entityType,
        entityId,
      },
    });
  }

  render() {
    const {
      entityName,
      entityType,
      entityId,
      mutator,
      onToggle,
      open,
      id,
    } = this.props;

    return (
      <IfPermission perm="ui-notes.item.view">
        <NotesAccordion
          assignedNotes={this.getAssignedNotes()}
          domainNotes={this.getDomainNotes()}
          onNoteCreateButtonClick={this.onNoteCreateButtonClick}
          onAssignedNoteClick={this.onAssignedNoteClick}
          entityName={entityName}
          entityType={entityType}
          entityId={entityId}
          onResetSearchResults={mutator.domainNotes.reset}
          onSaveAssigningResults={this.onSaveAssigningResults}
          onSearch={this.onSearch}
          onSortDomainNotes={this.onSortDomainNotes}
          fetchDomainNotes={this.fetchDomainNotes}
          id={id}
          open={open}
          onToggle={onToggle}
        />
      </IfPermission>
    );
  }
}

export default withRouter(NotesSmartAccordion);