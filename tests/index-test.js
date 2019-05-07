import React from 'react';
import { expect } from 'chai';
import { mount, configure } from 'enzyme';
import {
  Stage,
  Layer,
  Line,
  useStrictMode,
  Text,
} from '../src/ReactKonva';
import './mocking';
import Konva from 'konva';
import sinon from 'sinon/pkg/sinon';

import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

describe('Test references', function() {
  let instance;
  class App extends React.Component {
    render() {
      return (
        <Stage width={300} height={300} ref={node => (this.stage = node)}>
          <Line ref={node => (this.layer = node)} />
        </Stage>
      );
    }
  }

  beforeEach(() => {
    const wrapper = mount(<App />);
    instance = wrapper.instance();
  });

  it('can get stage instance', function() {
    const stageRef = instance.stage;
    expect(stageRef.getStage() instanceof Konva.Stage).to.equal(true);
  });

  it('check initial props set', function() {
    const stage = instance.stage.getStage();
    expect(stage.width()).to.equal(300);
    expect(stage.height()).to.equal(300);
  });

  it('can get layer instance', function() {
    expect(instance.layer instanceof Konva.Layer).to.equal(true);
  });

  // how can we make this work?
  it('stage ref should go to the stage', function() {
    const stageRef = instance.stage;
    expect(stageRef instanceof Konva.Stage).to.equal(true);
  });

  it('works ok with no ref', function() {
    class App extends React.Component {
      render() {
        return (
          <Stage width={300} height={300}>
            <Layer ref={node => (this.layer = node)} />
          </Stage>
        );
      }
    }
    const wrapper = mount(<App />);
    instance = wrapper.instance();
  });

  it('works ok with react ref', function() {
    class App extends React.Component {
      stage = React.createRef();
      render() {
        return (
          <Stage width={300} height={300} ref={this.stage}>
            <Layer ref={node => (this.layer = node)} />
          </Stage>
        );
      }
    }
    const wrapper = mount(<App />);
    instance = wrapper.instance();
    const stage = instance.stage.current;
    expect(stage instanceof Konva.Stage).to.equal(true);
  });
});

describe('Test stage component', function() {
  it('can attach stage events', function() {
    let eventCount = 0;
    const handleEvent = () => {
      eventCount += 1;
    };

    class App extends React.Component {
      render() {
        return (
          <Stage
            ref={node => (this.stage = node)}
            width={300}
            height={300}
            onMouseDown={handleEvent}
          >
            <Layer ref={node => (this.layer = node)}>
              <Line ref={node => (this.rect = node)} width={100} height={100} />
            </Layer>
          </Stage>
        );
      }
    }

    const wrapper = mount(<App />);
    const instance = wrapper.instance();
    const stage = instance.stage.getStage();
    stage.simulateMouseDown({ x: 50, y: 50 });
    expect(eventCount).to.equal(1);
  });

  it('can attach stage content events', function() {
    let eventCount = 0;
    const handleEvent = () => {
      eventCount += 1;
    };

    class App extends React.Component {
      render() {
        return (
          <Stage
            ref={node => (this.stage = node)}
            width={300}
            height={300}
            onContentMouseDown={handleEvent}
          >
            <Layer ref={node => (this.layer = node)}>
              <Line ref={node => (this.rect = node)} width={100} height={100} />
            </Layer>
          </Stage>
        );
      }
    }

    const wrapper = mount(<App />);
    const instance = wrapper.instance();
    const stage = instance.stage.getStage();
    stage.simulateMouseDown({ x: 50, y: 50 });
    expect(eventCount).to.equal(1);
  });

  it('unmount stage should destroy it from Konva', () => {
    class App extends React.Component {
      render() {
        if (this.props.skipStage) {
          return <div />;
        }
        return (
          <Stage ref={node => (this.stage = node)} width={300} height={300}>
            <Layer ref={node => (this.layer = node)} />
          </Stage>
        );
      }
    }

    const wrapper = mount(<App />);
    const instance = wrapper.instance();
    const stagesNumber = Konva.stages.length;
    wrapper.setProps({ skipStage: true });
    expect(Konva.stages.length).to.equal(stagesNumber - 1);
  });

  it('test null event', function() {
    class App extends React.Component {
      render() {
        return (
          <Stage
            ref={node => (this.stage = node)}
            width={300}
            height={300}
            onMouseDown={null}
          >
            <Layer ref={node => (this.layer = node)}>
              <Line ref={node => (this.rect = node)} width={100} height={100} />
            </Layer>
          </Stage>
        );
      }
    }

    const wrapper = mount(<App />);
    const instance = wrapper.instance();
    const stage = instance.stage.getStage();
    stage.simulateMouseDown({ x: 50, y: 50 });
  });
});

describe('Test props setting', function() {
  let instance, wrapper;
  class App extends React.Component {
    render() {
      return (
        <Stage ref={node => (this.stage = node)} width={300} height={300}>
          <Layer ref={node => (this.layer = node)}>
            <Line ref={node => (this.rect = node)} {...this.props.rectProps} />
          </Layer>
        </Stage>
      );
    }
  }

  beforeEach(() => {
    wrapper = mount(<App />);
    instance = wrapper.instance();
  });

  it('can update component props', () => {
    const rect = instance.rect;
    // set new props
    const props1 = {
      width: 100,
      height: 100
    };

    wrapper.setProps({ rectProps: props1 });

    expect(rect.width()).to.equal(100);

    const props2 = {
      width: 200,
      height: 100
    };
    wrapper.setProps({ rectProps: props2 });
    expect(rect.width()).to.equal(200);
  });
  it('can update component events', () => {
    const rect = instance.rect;
    // set new props
    const props1 = {
      onClick: () => {}
    };
    wrapper.setProps({ rectProps: props1 });
    expect(rect.eventListeners.click.length).to.equal(1);
    expect(rect.eventListeners.click[0].handler).to.equal(props1.onClick);

    const props2 = {
      onClick: () => {}
    };
    wrapper.setProps({ rectProps: props2 });
    expect(rect.eventListeners.click.length).to.equal(1);
    expect(rect.eventListeners.click[0].handler).to.equal(props2.onClick);
  });

  it('updating props should call layer redraw', () => {
    const layer = instance.layer;
    sinon.spy(layer, 'batchDraw');
    wrapper.setProps({
      rectProps: {
        fill: 'green'
      }
    });
    wrapper.setProps({
      rectProps: {
        fill: 'red'
      }
    });
    expect(layer.batchDraw.callCount).to.equal(2);
  });

  it('unset props', () => {
    const rect = instance.rect;
    wrapper.setProps({
      rectProps: {
        fill: 'red',
        x: 10
      }
    });
    expect(rect.fill()).to.equal('red');

    wrapper.setProps({ rectProps: {} });
    expect(!!rect.fill()).to.equal(false);
    expect(rect.x()).to.equal(0);
  });

  it('do not overwrite properties if that changed manually', () => {
    const rect = instance.rect;
    wrapper.setProps({
      rectProps: {
        fill: 'red',
        x: 10
      }
    });
    expect(rect.x()).to.equal(10);

    // change position manually
    rect.x(20);

    wrapper.setProps({
      rectProps: {
        fill: 'red',
        x: 10
      }
    });
    expect(rect.x()).to.equal(20);
  });

  it('overwrite properties if that changed manually in strict-mode', () => {
    useStrictMode(true);
    const rect = instance.rect;
    wrapper.setProps({
      rectProps: {
        fill: 'red',
        x: 10
      }
    });
    expect(rect.x()).to.equal(10);

    // change position manually
    rect.x(20);

    wrapper.setProps({
      rectProps: {
        fill: 'red',
        x: 10
      }
    });
    expect(rect.x()).to.equal(10);
    useStrictMode(false);
  });

  it('overwrite properties if that passed _useStrictMode', () => {
    const rect = instance.rect;
    wrapper.setProps({
      rectProps: {
        fill: 'red',
        x: 10
      }
    });
    expect(rect.x()).to.equal(10);

    // change position manually
    rect.x(20);

    wrapper.setProps({
      rectProps: {
        fill: 'red',
        x: 10,
        _useStrictMode: true
      }
    });
    expect(rect.x()).to.equal(10);
  });
});

describe('test lifecycle methods', () => {
  let instance, wrapper;

  class SubComponent extends React.Component {
    componentWillMount() {
      this.props.componentWillMount();
    }
    componentDidMount() {
      this.props.componentDidMount();
    }
    componentWillReceiveProps(newProps) {
      this.props.componentWillReceiveProps(newProps);
    }
    shouldComponentUpdate() {
      this.props.shouldComponentUpdate(...arguments);
      return true;
    }
    componentWillUpdate() {
      this.props.componentWillUpdate();
    }
    componentDidUpdate() {
      this.props.componentDidUpdate();
    }
    componentWillUnmount() {
      this.props.componentWillUnmount();
    }
    render() {
      return <Line />;
    }
  }
  class App extends React.Component {
    render() {
      return (
        <Stage ref={node => (this.stage = node)} width={300} height={300}>
          <Layer ref={node => (this.layer = node)}>
            {this.props.dontDrawChildren ? null : (
              <SubComponent {...this.props} />
            )}
          </Layer>
        </Stage>
      );
    }
  }

  it('test mount', () => {
    const props = {
      componentWillMount: sinon.spy(),
      componentDidMount: sinon.spy()
    };
    wrapper = mount(<App {...props} />);

    expect(props.componentWillMount.called).to.equal(true);
    expect(props.componentDidMount.called).to.equal(true);
  });

  it('test update', () => {
    const props = {
      componentWillMount: sinon.spy(),
      componentDidMount: sinon.spy(),
      componentWillReceiveProps: sinon.spy(),
      shouldComponentUpdate: sinon.spy(),
      componentWillUpdate: sinon.spy(),
      componentDidUpdate: sinon.spy(),
      componentWillUnmount: sinon.spy()
    };
    wrapper = mount(<App {...props} />);
    wrapper.setProps(props);

    expect(props.componentWillMount.called).to.equal(true);
    expect(props.shouldComponentUpdate.called).to.equal(true);
    expect(props.componentWillUpdate.called).to.equal(true);
    expect(props.componentDidUpdate.called).to.equal(true);
  });

  it('test remove', () => {
    const props = {
      componentWillMount: sinon.spy(),
      componentDidMount: sinon.spy(),
      componentWillReceiveProps: sinon.spy(),
      shouldComponentUpdate: sinon.spy(),
      componentWillUpdate: sinon.spy(),
      componentDidUpdate: sinon.spy(),
      componentWillUnmount: sinon.spy()
    };
    wrapper = mount(<App {...props} />);
    const stage = wrapper.instance().stage.getStage();
    expect(stage.findOne('Rect')).to.not.equal(undefined);

    props.dontDrawChildren = props;
    wrapper.setProps(props);
    expect(stage.findOne('Rect')).to.equal(undefined);
    // This line don't work... why????
    expect(props.componentWillUnmount.called).to.equal(true);
  });
});

describe('Test Events', function() {
  let instance;
  class App extends React.Component {
    render() {
      return (
        <Stage width={300} height={300} ref={node => (this.stage = node)}>
          {this.props.shouldDrawLayer && (
            <Layer
              ref={node => (this.layer = node)}
              onClick={this.props.onClick}
            />
          )}
        </Stage>
      );
    }
  }
  it('should remove events on unmount', function() {
    const onClickRect = sinon.spy();
    const onClickExternal = sinon.spy();

    const wrapper = mount(<App onClick={onClickRect} shouldDrawLayer />);
    instance = wrapper.instance();

    const stageRef = instance.stage;
    const layer = stageRef.getStage().findOne('Layer');
    layer.on('click', onClickExternal);

    expect(onClickRect.callCount).to.equal(0);
    expect(onClickExternal.callCount).to.equal(0);

    layer._fire('click', {});
    expect(onClickRect.callCount).to.equal(1);
    expect(onClickExternal.callCount).to.equal(1);

    // remove layer
    wrapper.setProps({ shouldDrawLayer: false });

    expect(layer.getParent()).to.equal(undefined);

    layer._fire('click', {});

    expect(onClickRect.callCount).to.equal(1);
    expect(onClickExternal.callCount).to.equal(2);
  });
});

// will fail
describe.skip('Bad structure', () => {
  it('No dom inside Konva', function() {
    class App extends React.Component {
      render() {
        return (
          <Stage ref={node => (this.stage = node)} width={300} height={300}>
            <Layer>
              <div />
            </Layer>
          </Stage>
        );
      }
    }

    const wrapper = mount(<App />);
    const instance = wrapper.instance();
    const stage = instance.stage.getStage();
  });
});

// TODO: how to fix it?
// react is creating new nodes before removing old one
// that creates mess in id references
// see: https://github.com/konvajs/react-konva/issues/119

describe('Test drawing calls', () => {
  it('Draw layer on mount', function() {
    class App extends React.Component {
      render() {
        return (
          <Stage ref={node => (this.stage = node)} width={300} height={300}>
            <Layer>
              <Line fill="red" />
            </Layer>
          </Stage>
        );
      }
    }

    expect(Konva.Layer.prototype.batchDraw.callCount).to.equal(undefined);
    sinon.spy(Konva.Layer.prototype, 'batchDraw');
    const wrapper = mount(<App />);

    expect(Konva.Layer.prototype.batchDraw.called).to.equal(true);
    Konva.Layer.prototype.batchDraw.restore();
  });

  it('Draw layer on node add', function() {
    class App extends React.Component {
      render() {
        return (
          <Stage ref={node => (this.stage = node)} width={300} height={300}>
            <Layer>{this.props.showRect && <Line fill="red" />}</Layer>
          </Stage>
        );
      }
    }

    const wrapper = mount(<App />);
    sinon.spy(Konva.Layer.prototype, 'batchDraw');
    wrapper.setProps({ showRect: true });

    expect(Konva.Layer.prototype.batchDraw.callCount).to.equal(1);
    Konva.Layer.prototype.batchDraw.restore();
  });

  it('Draw layer on node remove', function() {
    class App extends React.Component {
      render() {
        return (
          <Stage ref={node => (this.stage = node)} width={300} height={300}>
            <Layer>{!this.props.hideRect && <Line fill="red" />}</Layer>
          </Stage>
        );
      }
    }

    const wrapper = mount(<App />);
    sinon.spy(Konva.Layer.prototype, 'batchDraw');
    expect(Konva.Layer.prototype.batchDraw.callCount).to.equal(0);
    wrapper.setProps({ hideRect: true });

    expect(Konva.Layer.prototype.batchDraw.callCount).to.equal(1);
    Konva.Layer.prototype.batchDraw.restore();
  });
});

describe('test reconciler', () => {
  it('add before', function() {
    class App extends React.Component {
      render() {
        const kids = this.props.drawMany
          ? [<Line key="1" name="rect1" />, <Line key="2" name="rect2" />]
          : [<Line key="2" name="rect2" />];
        return (
          <Stage ref={node => (this.stage = node)} width={300} height={300}>
            <Layer ref={node => (this.layer = node)}>{kids}</Layer>
          </Stage>
        );
      }
    }

    const wrapper = mount(<App />);
    sinon.spy(Konva.Layer.prototype, 'batchDraw');
    wrapper.setProps({ drawMany: true });

    const layer = wrapper.instance().layer;
    expect(layer.children[0].name()).to.equal('rect1');
    expect(layer.children[1].name()).to.equal('rect2');
    expect(Konva.Layer.prototype.batchDraw.callCount).to.equal(1);
    Konva.Layer.prototype.batchDraw.restore();
  });

  it('add before (mane)', function() {
    class App extends React.Component {
      render() {
        const kids = this.props.drawMany
          ? [
              <Line key="1" name="rect1" />,
              <Line key="2" name="rect2" />,
              <Line key="3" name="rect3" />
            ]
          : [<Line key="1" name="rect1" />, <Line key="3" name="rect3" />];
        return (
          <Stage ref={node => (this.stage = node)} width={300} height={300}>
            <Layer ref={node => (this.layer = node)}>{kids}</Layer>
          </Stage>
        );
      }
    }

    const wrapper = mount(<App />);
    wrapper.setProps({ drawMany: true });

    const layer = wrapper.instance().layer;
    expect(layer.children[0].name()).to.equal('rect1');
    expect(layer.children[1].name()).to.equal('rect2');
    expect(layer.children[2].name()).to.equal('rect3');
  });

  it('add after', function() {
    class App extends React.Component {
      render() {
        const kids = this.props.drawMany
          ? [<Line key="1" name="rect1" />, <Line key="2" name="rect2" />]
          : [<Line key="1" name="rect1" />];
        return (
          <Stage ref={node => (this.stage = node)} width={300} height={300}>
            <Layer ref={node => (this.layer = node)}>{kids}</Layer>
          </Stage>
        );
      }
    }

    const wrapper = mount(<App />);
    sinon.spy(Konva.Layer.prototype, 'batchDraw');
    wrapper.setProps({ drawMany: true });

    const layer = wrapper.instance().layer;
    expect(layer.children[0].name()).to.equal('rect1');
    expect(layer.children[1].name()).to.equal('rect2');
    expect(Konva.Layer.prototype.batchDraw.callCount).to.equal(1);
    Konva.Layer.prototype.batchDraw.restore();
  });

  it('change order', function() {
    class App extends React.Component {
      render() {
        return (
          <Stage ref={node => (this.stage = node)} width={300} height={300}>
            <Layer ref={node => (this.layer = node)}>{this.props.kids}</Layer>
          </Stage>
        );
      }
    }

    let kids = [
      <Line key="1" name="rect1" />,
      <Line key="2" name="rect2" />,
      <Line key="3" name="rect3" />
    ];
    const wrapper = mount(<App kids={kids} />);
    const layer = wrapper.instance().layer;

    expect(layer.children[0].name()).to.equal('rect1');
    expect(layer.children[1].name()).to.equal('rect2');
    expect(layer.children[2].name()).to.equal('rect3');

    kids = [
      <Line key="3" name="rect3" />,
      <Line key="1" name="rect1" />,
      <Line key="2" name="rect2" />
    ];
    wrapper.setProps({ kids });
    expect(layer.children[0].name()).to.equal('rect3');
    expect(layer.children[1].name()).to.equal('rect1');
    expect(layer.children[2].name()).to.equal('rect2');

    kids = [
      <Line key="1" name="rect1" />,
      <Line key="3" name="rect3" />,
      <Line key="2" name="rect2" />
    ];
    wrapper.setProps({ kids });

    expect(layer.children[0].name()).to.equal('rect1');
    expect(layer.children[1].name()).to.equal('rect3');
    expect(layer.children[2].name()).to.equal('rect2');
  });
});

describe('Test context API', function() {
  let instance;

  const { Consumer, Provider } = React.createContext({
    width: 100,
    height: 100
  });
  class App extends React.Component {
    render() {
      return (
        <Provider value={{ width: 200, height: 100 }}>
          <Consumer>
            {({ width, height }) => (
              <Stage
                width={width}
                height={height}
                ref={node => (this.stage = node)}
              >
                <Layer ref={node => (this.layer = node)} />
              </Stage>
            )}
          </Consumer>
        </Provider>
      );
    }
  }

  beforeEach(() => {
    const wrapper = mount(<App />);
    instance = wrapper.instance();
  });

  it('test correct set', function() {
    const stageRef = instance.stage;
    const stage = stageRef.getStage();
    expect(stage.width()).to.equal(200);
    expect(stage.height()).to.equal(100);
  });
});

// wait for react team response
describe('Test nested context API', function() {
  let instance;

  const Context = React.createContext({
    color: 'red'
  });

  class Tools extends React.Component {
    static contextType = Context;
    render() {
      return (
        <Layer>
          <Line width={50} height={50} fill={this.context.color} />
        </Layer>
      );
    }
  }

  class Canvas extends React.Component {
    static contextType = Context;
    render() {
      return (
        <Stage width={300} height={200} ref={node => (this.stage = node)}>
          <Tools />
        </Stage>
      );
    }
  }

  class App extends React.Component {
    render() {
      return (
        <Context.Provider value={{ color: 'black' }}>
          <Canvas />
        </Context.Provider>
      );
    }
  }

  beforeEach(() => {
    const wrapper = mount(<App />);
    instance = wrapper.instance();
  });

  it.skip('test correct set', function() {
    const stageRef = instance.stage;
    const stage = Konva.stages[Konva.stages.length - 1];
    expect(stage.findOne('Rect').fill()).to.equal('black');
  });
});

// wait for react team response
describe('try lazy and suspense', function() {
  const LazyRect = React.lazy(() => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          default: () => <Line />
        });
      }, 10);
    });
  });

  class App extends React.Component {
    render() {
      return (
        <Stage ref={node => (this.stage = node)} width={300} height={300}>
          <Layer ref={node => (this.layer = node)}>
            <React.Suspense fallback={<Text text="fallback" />}>
              <LazyRect />
            </React.Suspense>
          </Layer>
        </Stage>
      );
    }
  }

  let instance;
  beforeEach(() => {
    const wrapper = mount(<App />);
    instance = wrapper.instance();
  });

  it('can use lazy and suspense', function(done) {
    const stageRef = instance.stage;
    const stage = stageRef.getStage();
    expect(stage.find('Text').length).to.equal(1);
    expect(stage.find('Shape').length).to.equal(1);

    setTimeout(() => {
      expect(stage.find('Text').length).to.equal(0);
      expect(stage.find('Rect').length).to.equal(1);
      expect(stage.find('Shape').length).to.equal(1);
      done();
    }, 20);
  });
});
