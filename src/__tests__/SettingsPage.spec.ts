import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useSessionConfigStore } from '../stores/sessionConfig'
import type { BreathPreset } from '../types/breathing'

vi.mock('../services/presetManager')
vi.mock('../services/timerEngine')

import { presetManager } from '../services/presetManager'
import { timerEngine } from '../services/timerEngine'
import SettingsPage from '../views/SettingsPage.vue'

const defaultPreset: BreathPreset = {
  id: 'box_default',
  name: 'Box Breath',
  inhaleSec: 4,
  holdInSec: 4,
  exhaleSec: 4,
  holdOutSec: 4,
  isDefault: true,
}
const customPreset: BreathPreset = {
  id: 'preset_custom',
  name: 'Custom',
  inhaleSec: 4,
  holdInSec: 0,
  exhaleSec: 8,
  holdOutSec: 0,
  isDefault: false,
}

let pinia: ReturnType<typeof createPinia>

const mountComponent = () =>
  mount(SettingsPage, {
    global: {
      plugins: [pinia],
    },
  })

describe('SettingsPage', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    vi.mocked(presetManager.list).mockReturnValue([defaultPreset, customPreset])
    vi.mocked(presetManager.create).mockImplementation((p) => ({ ...p, id: 'preset_new' }))
    vi.mocked(presetManager.update).mockImplementation((p) => p)
    vi.mocked(presetManager.delete).mockImplementation(() => {})
    vi.mocked(timerEngine.stop).mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('preset list renders both presets', () => {
    const wrapper = mountComponent()
    const cards = wrapper.findAll('.preset-card')
    expect(cards).toHaveLength(2)
    expect(cards[0]!.text()).toContain('Box Breath')
    expect(cards[1]!.text()).toContain('Custom')
  })

  it('modal is hidden by default', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('.modal').exists()).toBe(false)
  })

  it('clicking a preset applies active class to it and removes from others', async () => {
    const wrapper = mountComponent()
    const [defaultCard, customCard] = wrapper.findAll('.preset-card')
    await customCard!.trigger('click')
    expect(customCard!.classes()).toContain('preset-card--active')
    expect(defaultCard!.classes()).not.toContain('preset-card--active')
  })

  it('clicking a preset calls setSelectedPresetId', async () => {
    const store = useSessionConfigStore()
    const spy = vi.spyOn(store, 'setSelectedPresetId')
    const wrapper = mountComponent()
    await wrapper.findAll('.preset-card')[1]!.trigger('click')
    expect(spy).toHaveBeenCalledWith('preset_custom')
  })

  it('"New Preset" shows blank form with Save Preset button', async () => {
    const wrapper = mountComponent()
    await wrapper.find('.new-preset-desktop').trigger('click')
    await nextTick()
    expect(wrapper.find('.modal form').exists()).toBe(true)
    expect((wrapper.find('input[type=text]').element as HTMLInputElement).value).toBe('')
    expect(wrapper.find('[type=submit]').text()).toContain('Save Preset')
  })

  it('edit shows form pre-filled and button says Update Preset', async () => {
    const wrapper = mountComponent()
    await wrapper.findAll('.preset-edit-btn')[1]!.trigger('click')
    await nextTick()
    expect(wrapper.find('.modal form').exists()).toBe(true)
    expect((wrapper.find('input[type=text]').element as HTMLInputElement).value).toBe('Custom')
    const numberInputs = wrapper.findAll('input[type=number]')
    expect((numberInputs[0]!.element as HTMLInputElement).value).toBe('4') // inhale
    expect((numberInputs[2]!.element as HTMLInputElement).value).toBe('8') // exhale
    expect(wrapper.find('[type=submit]').text()).toContain('Update Preset')
  })

  it('close button hides the modal', async () => {
    const wrapper = mountComponent()
    await wrapper.findAll('.preset-edit-btn')[1]!.trigger('click')
    await nextTick()
    expect(wrapper.find('.modal').exists()).toBe(true)
    await wrapper.find('.modal-close-btn').trigger('click')
    await nextTick()
    expect(wrapper.find('.modal').exists()).toBe(false)
  })

  it('saving new preset calls presetManager.create and shows success', async () => {
    const wrapper = mountComponent()
    await wrapper.find('.new-preset-desktop').trigger('click')
    await nextTick()
    await wrapper.find('input[type=text]').setValue('My Pattern')
    await wrapper.find('.modal form').trigger('submit')
    await nextTick()
    expect(vi.mocked(presetManager.create)).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'My Pattern', isDefault: false }),
    )
    expect(wrapper.find('.field-success').text()).toContain('My Pattern')
    expect(wrapper.find('.modal').exists()).toBe(false)
  })

  it('updating preset calls presetManager.update not create', async () => {
    const wrapper = mountComponent()
    await wrapper.findAll('.preset-edit-btn')[1]!.trigger('click')
    await nextTick()
    await wrapper.find('input[type=text]').setValue('Renamed')
    await wrapper.find('.modal form').trigger('submit')
    await nextTick()
    expect(vi.mocked(presetManager.update)).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'preset_custom', name: 'Renamed' }),
    )
    expect(vi.mocked(presetManager.create)).not.toHaveBeenCalled()
    expect(wrapper.find('.field-success').text()).toContain('updated')
  })

  it('empty name shows validation error and create not called', async () => {
    const wrapper = mountComponent()
    await wrapper.find('.new-preset-desktop').trigger('click')
    await nextTick()
    await wrapper.find('.modal form').trigger('submit')
    await nextTick()
    expect(wrapper.find('.field-error').text()).toContain('Please provide a name')
    expect(vi.mocked(presetManager.create)).not.toHaveBeenCalled()
  })

  it('delete button disabled for default preset', () => {
    const wrapper = mountComponent()
    const deleteButtons = wrapper.findAll('.preset-delete-btn')
    expect(deleteButtons[0]!.attributes('disabled')).toBeDefined()
  })

  it('delete button enabled for custom preset', () => {
    const wrapper = mountComponent()
    const deleteButtons = wrapper.findAll('.preset-delete-btn')
    expect(deleteButtons[1]!.attributes('disabled')).toBeUndefined()
  })

  it('first delete click shows confirm and cancel, does not delete', async () => {
    const wrapper = mountComponent()
    await wrapper.findAll('.preset-delete-btn')[1]!.trigger('click')
    await nextTick()
    expect(wrapper.find('.preset-delete-confirm-btn').exists()).toBe(true)
    expect(wrapper.find('.preset-delete-cancel-btn').exists()).toBe(true)
    expect(vi.mocked(presetManager.delete)).not.toHaveBeenCalled()
  })

  it('cancel delete restores delete button', async () => {
    const wrapper = mountComponent()
    await wrapper.findAll('.preset-delete-btn')[1]!.trigger('click')
    await nextTick()
    await wrapper.find('.preset-delete-cancel-btn').trigger('click')
    await nextTick()
    expect(wrapper.find('.preset-delete-confirm-btn').exists()).toBe(false)
    expect(vi.mocked(presetManager.delete)).not.toHaveBeenCalled()
  })

  it('confirm delete calls presetManager.delete and updates list', async () => {
    vi.mocked(presetManager.delete).mockImplementation(() => {
      vi.mocked(presetManager.list).mockReturnValue([defaultPreset])
    })
    const wrapper = mountComponent()
    await wrapper.findAll('.preset-delete-btn')[1]!.trigger('click')
    await nextTick()
    await wrapper.find('.preset-delete-confirm-btn').trigger('click')
    await nextTick()
    expect(vi.mocked(presetManager.delete)).toHaveBeenCalledWith('preset_custom')
    expect(wrapper.findAll('.preset-card')).toHaveLength(1)
  })

  it('deleting selected preset selects first remaining', async () => {
    vi.mocked(presetManager.delete).mockImplementation(() => {
      vi.mocked(presetManager.list).mockReturnValue([defaultPreset])
    })
    const store = useSessionConfigStore()
    store.setSelectedPresetId('preset_custom')
    const wrapper = mountComponent()
    await wrapper.findAll('.preset-delete-btn')[1]!.trigger('click')
    await nextTick()
    await wrapper.find('.preset-delete-confirm-btn').trigger('click')
    await nextTick()
    expect(store.selectedPresetId).toBe('box_default')
  })

  it('timerEngine.stop called on unmount', () => {
    const wrapper = mountComponent()
    wrapper.unmount()
    expect(vi.mocked(timerEngine.stop)).toHaveBeenCalled()
  })
})
