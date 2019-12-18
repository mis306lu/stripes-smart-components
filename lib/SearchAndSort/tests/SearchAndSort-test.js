import React from 'react';
import { describe, beforeEach, it } from '@bigtest/mocha';
import { expect } from 'chai';

import { setupApplication, mount, wait } from '../../../tests/helpers';
import connectStripes from '../../../tests/connectStripes';

import SearchAndSortInteractor from './interactor';
import SearchAndSort from '../SearchAndSort';

describe('SearchAndSort', () => {
  setupApplication();
  const searchAndSort = new SearchAndSortInteractor();
  const ConnectedComponent = connectStripes(SearchAndSort);

  beforeEach(async function () {
    this.server.createList('instance', 25, 'withHoldingAndItem');
    mount(
      <ConnectedComponent
        initialResultCount={0}
        resultCountIncrement={0}
        viewRecordPerms="test"
        objectName="user"
        parentResources={{
          records: {
            records: () => [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
            totalCount: () => 99999,
          }
        }}
        parentMutator={{
          resultCount: {
            replace: () => { }
          },
          resultOffset: {
            replace: () => { }
          },
        }}
        filterConfig={[]}
        packageInfo={{
          stripes: {},
          name: 'Search and sort test',
        }}
        viewRecordComponent={() => <div />}
      />
    );
  });

  describe('Filter Pane', () => {
    it('should be visible', () => {
      expect(searchAndSort.filterPane.isPresent).to.be.true;
    });

    it('should render a collapse button', () => {
      expect(searchAndSort.collapseFilterPaneButton.isPresent).to.be.true;
    });

    describe('Clicking the collapse filter pane button', () => {
      beforeEach(async () => {
        await searchAndSort.collapseFilterPaneButton.click();
        await wait(200);
      });
      it('should hide the filter pane', () => {
        expect(searchAndSort.filterPane.isPresent).to.be.false;
      });
      it('should render an expand button', () => {
        expect(searchAndSort.expandFilterPaneButton.isPresent).to.be.true;
      });
    });

    describe('Fetch more by offset', () => {
      setupApplication();
      const searchAndSort = new SearchAndSortInteractor();
      const ConnectedComponent = connectStripes(SearchAndSort);
  
      beforeEach(async () => {
        //await ConnectedComponent.records.fetchOffset(1, 1);
        await searchAndSort.searchFieldFilter.searchField.fillInput('test');
        await searchAndSort.searchFieldFilter.clickSearch();
      });

      it('finds instances by title and contributor name', () => {
        expect(searchAndSort.rows().length).to.equal(1);
      });
    });
  });
});
