import React from 'react';
import {connect} from 'react-redux';
import {decrementCounter, incrementCounter} from '../redux/actions/counterActions';
import styled from 'styled-components'
import Typography from '@material-ui/core/Typography';

const Title = styled.h1`
  font-size: 50px;
`

class App extends React.Component {

    static getInitialProps({store, isServer, pathname, query}) {
        store.dispatch(incrementCounter())
        store.dispatch(incrementCounter())
        store.dispatch(incrementCounter())
    }

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <Title>Styled Component Example</Title>
                <Typography variant="h4" component="h1" gutterBottom>
                    Material Example
                </Typography>
                <button onClick={this.props.incrementCounter}>Increment</button>
                <button onClick={this.props.decrementCounter}>Decrement</button>
                <h1>{this.props.counter}</h1>
            </div>
        );
    }
}

const mapStateToProps = state => ({
    counter: state.counter.value
});

const mapDispatchToProps = {
    incrementCounter: incrementCounter,
    decrementCounter: decrementCounter,
};
export default connect(mapStateToProps, mapDispatchToProps)(App);