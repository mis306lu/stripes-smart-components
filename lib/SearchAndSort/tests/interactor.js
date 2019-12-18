import {
  interactor,
  Interactor,
  isPresent,
  text,
  scoped,
} from '@bigtest/interactor';
import SearchFieldFilterInteractor from './searchfield-filter';
import ExpandFilterPaneButtonInteractor from '../components/ExpandFilterPaneButton/tests/interactor';

export default interactor(class SearchAndSortInteractor {
  defaultScope = '[data-test-search-and-sort]';
  searchFieldFilter = scoped('#pane-filter', SearchFieldFilterInteractor);
  filterPane = new Interactor('[data-test-filter-pane]');
  collapseFilterPaneButton = new Interactor('[data-test-collapse-filter-pane-button]');
  expandFilterPaneButton = new ExpandFilterPaneButtonInteractor();

  resultsSubtitle = text('#paneHeaderpane-results-subtitle');
  noResultsMessageIsPresent = isPresent('[class^=mclEmptyMessage]');
  noResultsMessage = text('[class^=mclEmptyMessage]');
});
