import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Switch from 'react-router-dom/Switch';
import Route from 'react-router-dom/Route';

import { withStripes } from '@folio/stripes-core';
import NavListItem from '@folio/stripes-components/lib/NavListItem';
import {
  NavList,
  NavListSection,
  Pane,
  PaneBackLink,
} from '@folio/stripes-components';

class Settings extends Component {
  constructor(props) {
    super(props);
    const stripes = props.stripes;

    this.sections = props.sections;

    // if props.section was not provided, push props.pages into an array
    // so it can act like props.sections. this allows all the logic here to
    // act like we have an array of sections containing an array of
    // { label: string, pages: array } objects, which is simpler than
    // separate logic for props.sections and props.pages.
    if (!this.sections) {
      this.sections = [{
        label: '',
        pages: props.pages || [],
      }];
    }

    // this.routes contains routes from all pages across all sections
    this.routes = [];
    this.sections.forEach(section => {
      const sectionRoutes = section.pages
        .filter(p => !p.perm || stripes.hasPerm(p.perm))
        .map(page => ({
          page,
          component: stripes.connect(page.component, { dataKey: page.route }),
        }));
      this.routes = [...this.routes, ...sectionRoutes];
    });
  }

  render() {
    const props = this.props;
    const stripes = props.stripes;
    let { activeLink } = this.props;

    // links in a given section
    const navlinks = (section) => {
      const navItems = section.pages.map((p) => {
        const link = `${props.match.path}/${p.route}`;
        if (props.location.pathname.startsWith(link)) {
          activeLink = link;
        }
        if (p.perm && !stripes.hasPerm(p.perm)) return null;
        return <NavListItem key={p.route} to={link}>{p.label}</NavListItem>;
      }).filter(x => x !== null);

      return (
        <NavListSection activeLink={activeLink} label={section.label}>
          {navItems}
        </NavListSection>
      );
    };

    let Saved;
    const routes = this.routes.map((p) => {
      const Current = p.component;
      if (!Saved) Saved = Current;
      return (<Route
        key={p.page.route}
        path={`${props.match.path}/${p.page.route}`}
        render={props2 => <Current {...props2} stripes={stripes} label={p.page.label} />}
      />);
    });

    return (
      <>
        <Pane
          defaultWidth={props.navPaneWidth}
          paneTitle={props.paneTitle || 'Module Settings'}
          firstMenu={<PaneBackLink to="/settings" />}
        >
          {this.sections.map((section, index) => {
            const {
              label: {
                props: sectionProps,
              },
            } = section;
            const id = sectionProps && sectionProps.id ? sectionProps.id : 'Module Settings';

            return (
              <NavList
                key={index}
                aria-label={id}
              >
                {navlinks(section)}
              </NavList>
            );
          })
          }
        </Pane>
        <Switch>
          {routes}
        </Switch>
      </>
    );
  }
}

Settings.propTypes = {
  activeLink: PropTypes.string,
  location: PropTypes.shape({
    pathname: PropTypes.string,
  }),
  match: PropTypes.shape({
    path: PropTypes.string.isRequired,
  }).isRequired,
  navPaneWidth: PropTypes.string,
  pages: PropTypes.arrayOf(
    PropTypes.shape({
      component: PropTypes.func.isRequired,
      label: PropTypes.node.isRequired,
      perm: PropTypes.string,
      route: PropTypes.string.isRequired,
    }),
  ),
  paneTitle: PropTypes.node,
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.node.isRequired,
      pages: PropTypes.arrayOf(
        PropTypes.shape({
          component: PropTypes.func.isRequired,
          label: PropTypes.node.isRequired,
          perm: PropTypes.string,
          route: PropTypes.string.isRequired,
        }),
      ).isRequired,
    }),
  ),
  stripes: PropTypes.shape({
    connect: PropTypes.func.isRequired,
    hasPerm: PropTypes.func.isRequired,
  }).isRequired,
};

Settings.defaultProps = {
  navPaneWidth: '30%',
};

export default withStripes(Settings);
