import { SimplyImmutable } from './SimplyImmutable';

import { runTestSuite } from 'immutable-benchmark-lib/dist/TestRunner';

runTestSuite('simply-immutable', new SimplyImmutable(false));
