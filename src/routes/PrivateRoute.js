import React from 'react';
import { Redirect, Route } from "react-router-dom";
import Template from "../template";

const PrivateRoute = props => {
  const { component: Component, path, withoutTemplate, ...rest } = props;
  const isAuthenticated = !!localStorage.getItem('token');
  const getPrivateView = (componentProps) => withoutTemplate ? <Component {...componentProps} /> : (
      <Template path={"/" + rest.location.pathname.split('/')[1]}>
          <Component {...componentProps} />
      </Template>
  );

  return (
    <Route
      {...rest}
      render={props => isAuthenticated ? getPrivateView(props) : <Redirect to={{ pathname: '/login' }}/>}
    />
  );
};

export default PrivateRoute;
