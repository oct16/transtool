<template>
    <div class="nav-header">
        <el-menu :default-active="activeName" router class="" mode="horizontal" background-color="#545c64" text-color="#fff" active-text-color="#ffd04b">
            <el-menu-item index="entrance">Transtool</el-menu-item>
            <el-menu-item index="project" v-if="projectName">
                {{ projectName }}
            </el-menu-item>

        </el-menu>
        <div class="actions" v-if="projectPath">
            <el-input clearable v-if="fileName" size="mini" class="mt-4" style="width: 200px" v-model="searchInput" placeholder="Search"></el-input>
            <el-dropdown trigger="click" v-if="fileName" @command="handleCommand">
                <el-button size="mini" >
                    Edit
                    <i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item command="add">
                        Add
                    </el-dropdown-item>
                    <el-dropdown-item command="delete">
                        Delete
                    </el-dropdown-item>
                    <el-dropdown-item command="trans">
                        Trans
                    </el-dropdown-item>
                    <!-- <el-dropdown-item command="trans-all">
                        Trans All
                    </el-dropdown-item> -->
                </el-dropdown-menu>
            </el-dropdown>
            <el-dropdown trigger="click" v-if="fileName" @command="handleCommand">
                <el-button size="mini" >
                    Git
                    <i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item v-if="fileName" command="save">Save Changes</el-dropdown-item>
                    <el-dropdown-item v-if="fileName" command="reset">
                        Reset Changes
                    </el-dropdown-item>
                    <!-- <el-dropdown-item command="reset-all">
                        Reset All Changes
                    </el-dropdown-item> -->
                    <el-dropdown-item v-if="fileName" command="diff">
                        Review Diff
                    </el-dropdown-item>
                    <!-- <el-dropdown-item type="primary" command="commit">
                        Commit To Server
                    </el-dropdown-item> -->
                </el-dropdown-menu>
            </el-dropdown>
        </div>
    </div>
</template>
<script>
import _ from 'lodash'
export default {
    name: 'app-header',
    data() {
        return {
            searchInput: '',
            projectName: null,
            debounceSearch: null
        }
    },
    created() {
        this.debounceSearch = _.debounce(this.search, 200)
    },
    computed: {
        projectPath() {
            return this.$store.state.base.projectPath
        },
        fileName() {
            return this.$store.state.base.fileName
        },
        activeName() {
            return this.$route.name
        }
    },
    watch: {
        searchInput(val) {
            this.debounceSearch(val)
        },
        projectPath(value) {
            this.projectName = value.replace(/.*\//, '').toUpperCase()
        }
    },
    methods: {
        handleCommand(command) {
            this.$bus.$emit(command)
        },
        search(val) {
            this.$bus.$emit('search', val)
        }
    }
}
</script>

<style scoped>
.actions {
    position: absolute;
    right: 10px;
    height: 40px;
    top: -8px;
}

.nav-header {
    height: 60px;
    z-index: 111;
    top: 0;
    left: 0;
    position: fixed;
    width: 100%;
}
</style>

