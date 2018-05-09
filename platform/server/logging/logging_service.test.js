import { BehaviorSubject } from '../../lib/kbn_observable';
import { MutableLoggerFactory } from './logger_factory';
import { LoggingConfig } from './logging_config';
import { LoggingService } from './logging_service';

const createConfig = () => {
  return new LoggingConfig({
    appenders: new Map(),
    loggers: [],
    root: {
      appenders: ['default'],
      level: 'info',
    },
  });
};

const getLastMockCallArgs = mockFunction => {
  expect(mockFunction).toHaveBeenCalled();
  return mockFunction.mock.calls[mockFunction.mock.calls.length - 1];
};

let factory;
let service;
let updateConfigMock;

beforeEach(() => {
  factory = new MutableLoggerFactory({});
  updateConfigMock = jest
    .spyOn(factory, 'updateConfig')
    .mockImplementation(() => {});
  jest.spyOn(factory, 'close').mockImplementation(() => {});

  service = new LoggingService(factory);
});

test('`upgrade()` updates logging factory config.', () => {
  expect(factory.updateConfig).not.toHaveBeenCalled();

  const config = createConfig();
  const config$ = new BehaviorSubject(config);

  service.upgrade(config$.asObservable());

  expect(updateConfigMock).toHaveBeenCalledTimes(1);
  expect(getLastMockCallArgs(updateConfigMock)[0]).toBe(config);

  const newConfig = createConfig();
  config$.next(newConfig);
  expect(updateConfigMock).toHaveBeenCalledTimes(2);
  expect(getLastMockCallArgs(updateConfigMock)[0]).toBe(newConfig);
});

test('`stop()` closes logger factory and stops config updates.', async () => {
  const config$ = new BehaviorSubject(createConfig());

  service.upgrade(config$.asObservable());
  updateConfigMock.mockReset();

  await service.stop();

  expect(factory.close).toHaveBeenCalled();

  config$.next(createConfig());
  expect(updateConfigMock).not.toHaveBeenCalled();
});
