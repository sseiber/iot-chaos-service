import { ProcessRoutes } from '../../apis/process';
import { DomainProcessorService } from '../../services/domainProcessor';
import { NliProcessorService } from '../../services/nliProcessor';
import { ProcessorService } from '../../services/processor';

it('should be constructed', () => {
    const testInstance = new ProcessRoutes();
    expect(testInstance).toBeDefined();
});

it('should be constructed', () => {
    const testInstance = new DomainProcessorService();
    expect(testInstance).toBeDefined();
});

it('should be constructed', () => {
    const testInstance = new NliProcessorService();
    expect(testInstance).toBeDefined();
});

it('should be constructed', () => {
    const testInstance = new ProcessorService();
    expect(testInstance).toBeDefined();
});
