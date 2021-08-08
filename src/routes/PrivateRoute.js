import React from 'react';
import { Redirect, Route } from "react-router-dom";
import Template from "../template";
import { useLocalStorage } from '@rehooks/local-storage';
import { Provider as FetchProvider } from 'use-http';

const PrivateRoute = props => {
  const { component: Component, path, withoutTemplate, ...rest } = props;
  const [token] = useLocalStorage('token');

  const getPrivateView = (componentProps) => {
    return (
      <FetchProvider options={
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          },
          cachePolicy: 'no-cache'
        }
      }>
        {withoutTemplate ? <Component {...componentProps} /> : (
          <Template path={"/" + rest.location.pathname.split('/')[1]}>
            <Component {...componentProps} />
          </Template>
        )}
      </FetchProvider>
    )
  }

  return (
    <Route
      {...rest}
      render={props => token ? getPrivateView(props) : <Redirect to={{ pathname: '/login' }} />}
    />
  );
};

export default PrivateRoute;
