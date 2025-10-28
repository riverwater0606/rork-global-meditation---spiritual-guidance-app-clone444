import React from 'react';

const REACT_CONTEXT_TYPE = Symbol.for('react.context');

if (typeof (React as any).use !== 'function') {
  (React as any).use = (usable: any) => {
    if (usable && usable.$$typeof === REACT_CONTEXT_TYPE) {
      return React.useContext(usable);
    }

    if (typeof usable === 'function') {
      return usable();
    }

    return usable;
  };
}
