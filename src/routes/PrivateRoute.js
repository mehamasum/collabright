import React from 'react';
import { Redirect, Route } from "react-router-dom";
import Template from "../template";
import { useLocalStorage } from '@rehooks/local-storage';

const PrivateRoute = props => {
  const { component: Component, path, withoutTemplate, ...rest } = props;
  const [token] = useLocalStorage('token');

  const getPrivateView = (componentProps) => withoutTemplate ? <Component {...componentProps} /> : (
      <Template path={"/" + rest.location.pathname.split('/')[1]}>
          <Component {...componentProps} />
      </Template>
  );

  return (
    <Route
      {...rest}
      render={props => token ? getPrivateView(props) : <Redirect to={{ pathname: '/login' }}/>}
    />
  );
};

export default PrivateRoute;
