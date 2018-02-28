import React, { Component } from 'react'
import Flag from '../build/contracts/Flag.json'
import Thief from '../build/contracts/Thief.json'
import getWeb3 from './utils/getWeb3'
import Promise from 'bluebird'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      storageValue: 0,
      web3: null,
      flagInstance: { address: "loading" },
      thiefInstance: { address: "loading" },
      account: null,
      captured: []
    }
  }

  componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
    .then(results => {
      Promise.promisifyAll(results.web3.eth, { suffix: "Promise" })
      this.setState({
        web3: results.web3
      })

      // Instantiate contract once web3 provided.
      return this.instantiateContract()
    })
    .catch(e => {
      console.error('Error finding web3.', e);
    })
  }

  instantiateContract() {
    /*
     * SMART CONTRACT EXAMPLE
     *
     * Normally these functions would be called in the context of a
     * state management library, but for convenience I've placed them here.
     */

    const contract = require('truffle-contract')
    const flagFactory = contract(Flag)
    flagFactory.setProvider(this.state.web3.currentProvider)
    const thiefFactory = contract(Thief)
    thiefFactory.setProvider(this.state.web3.currentProvider)

    // Get accounts.
    return this.state.web3.eth.getAccountsPromise()
      .then(accounts => this.setState({ account: accounts.length > 0 ? accounts[0] : undefined }))
      .then(() => flagFactory.deployed())
      .then(instance => this.setState({ flagInstance: instance }))
      .then(() => thiefFactory.deployed())
      .then(instance => this.setState({ thiefInstance: instance }))
      .then(() => this.addEventListener(this));
  }

  addEventListener(component) {
    const eventCaptured = component.state.flagInstance.LogCaptured({}, { fromBlock: "2733528" });
    eventCaptured.watch(function(err, result) {
      if (err) {
        console.error(err);
        return;
      }
      // console.log("Captured received, value: " + result.args.who);
      component.setState({
        captured: component.state.captured.concat([ {
          txHash: result.transactionHash,
          who: result.args.who,
          brag: component.state.web3.toUtf8(result.args.braggingRights)
        }])
      });
    })
  }

  render() {
    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
            <a href="#" className="pure-menu-heading pure-menu-link">Captured Flags</a>
        </nav>

        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              <p>The flag: <a href={ "https://ropsten.etherscan.io/address/" + this.state.flagInstance.address }>
                {this.state.flagInstance.address}
              </a></p>

              <ul>
                {
                  this.state.captured.map((captured, index) => {
                    console.log(JSON.stringify(captured))
                    const who = captured.who == this.state.thiefInstance.address ? "Thief" : captured.who
                    return <li key={index}>
                      <a href={ "https://ropsten.etherscan.io/address/" + captured.who }>{who}</a> with&nbsp; 
                      <a href={ "https://ropsten.etherscan.io/tx/" + captured.txHash }>{ captured.brag }</a>
                    </li>
                  })
                }
              </ul>
            </div>
          </div>
        </main>
      </div>
    );
  }
}

export default App
