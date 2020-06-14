import React from 'react';
import {wrapper, extractStateFromCookies} from '../redux/store';
import App from 'next/app';
import { PersistGate } from "redux-persist/integration/react";
import {ReactReduxContext} from 'react-redux'
import { ThemeProvider } from '@material-ui/styles';
import theme from '../components/theme';
import CssBaseline from '@material-ui/core/CssBaseline';


class SampleApp extends App {

    static getInitialProps = async ({Component, ctx}) => {

        // ctx.store.dispatch({type: 'TOE', payload: 'was set in _app'});
        return {
            pageProps: {
                // Call page-level getInitialProps
                ...(Component.getInitialProps ? await Component.getInitialProps(ctx) : {}),
                // Some custom thing for all pages
                pathname: ctx.pathname,
            },
        };

    };

    render() {
        const {Component, pageProps} = this.props;

        return (     
          <ThemeProvider theme={theme}>    
            <CssBaseline /> 
            <Component {...pageProps} />
          </ThemeProvider>
        );

        // If UI is to be blocked till rehydration is completed
        // return (
        //   <ReactReduxContext.Consumer>
        //     {({ store }) => {
        //       <PersistGate persistor={store.__persistor} loading={<div>Loading</div>}>
        //         <Component {...pageProps} />
        //       </PersistGate>
        //     }}
        //   </ReactReduxContext.Consumer>
        // );
    }
}

export default wrapper.withRedux(SampleApp);