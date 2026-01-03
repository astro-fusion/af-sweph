#import "RNSweph.h"
#import <React/RCTLog.h>

@implementation RNSweph

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(swe_julday:(double)year
                  month:(double)month
                  day:(double)day
                  hour:(double)hour
                  gregflag:(double)gregflag
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    // Minimal mock implementation
    resolve(@(2451545.0));
}

// Additional methods would be implemented here, bridging to C++ impl

@end
