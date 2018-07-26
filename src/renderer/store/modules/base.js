import { loadKeys } from '../../common/count'
const state = {
    projectPath: null,
    fileName: null,
    filesKeys: {}
}
const getters = {}

const mutations = {
    SET_PROJECT_PATH(state, { path }) {
        state.projectPath = path
    },
    SET_FILENAME(state, { name }) {
        state.fileName = name
    },
    SET_FILES_KEYS(state, keys) {
        state.filesKeys = keys
    }
}

const actions = {
    setProjectPath({ commit }, { path }) {
        commit('SET_PROJECT_PATH', { path })
        loadKeys(path, (data) => {
            commit('SET_FILES_KEYS', data)
        })
    },
    setFileName({ commit }, state) {
        commit('SET_FILENAME', state)
    }
}

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions
}
