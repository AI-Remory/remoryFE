import { mockFeaturePages } from '../../data/mockFeaturePages'
import type { MockFeaturePageKey } from '../../data/mockFeaturePages'
import type { MockFeaturePageDefinition } from '../../types/mockFeatures'

export const mockFeatureService = {
  getPage(key: MockFeaturePageKey): MockFeaturePageDefinition {
    return mockFeaturePages[key]
  },
}
