import React from 'react';
import {styles, _l} from '../styles/main';

const eventInfo = (e) => {
    if (!e) return undefined;
    return {
        shift: e.shiftKey || false,
        ctrl: e.ctrlKey || false,
        alt: e.altKey || false,
        meta: e.metaKey || false,
        key: e.charCode || e.keyCode,
        stop: () => {
            e.stopPropagation();
        },
    }
};

const IconBtn = (props) => {
    return (
        <button
            style={_l([styles.btn])}
            onClick={(evt) => {
                if (props.onClick) props.onClick(eventInfo(evt));
            }}
            title={props.title}
        >
            <i className={`fa fa-fw fa-${props.icon}`}></i>
        </button>
    );
}

class IconMenu extends React.Component {

    constructor(props) {
        super(props);
        this.state = {expanded: false};
    }

    render() {
        const {children, dir, style} = this.props;
        const {expanded} = this.state;
        let menu = null;
        let st = [styles.hflex, styles.menu];
        let wst = [styles.hflex, styles.menu_popup];
        if (style && style.length) { // Copy
            st = st.concat(style);
            wst = wst.concat(style);
        };
        if (expanded) { // Render
            menu = (
                <div style={_l(styles.flex0, styles.menu_wrap)}>
                    <div
                        onMouseLeave={this.onMenuHide.bind(this)}
                        onClick={this.onMenuHide.bind(this)}
                        style={_l(wst)}
                    >
                        {children}
                    </div>
                </div>
            );
        };
        return (
            <div style={_l(st)}>
                {menu}
                <IconBtn
                    icon={expanded? 'caret-right': 'caret-left'}
                    onClick={this.onMenu.bind(this)}
                />
            </div>
        );
    }

    onMenu() {
        this.setState({
            expanded: !this.state.expanded,
        });
    }

    onMenuHide() {
        this.setState({
            expanded: false,
        });
    }
}

const Text = (props) => {
    let _st = [styles.flex0, styles.text];
    if (props.style && props.style.length) {
        _st = _st.concat(props.style);
    }
    const val = props.children || '';
    let sfx = ''
    while (props.width > val.length+sfx.length) {
        sfx += ' ';
    }
    let editIcn = null;
    if (props.editable === true) {
        editIcn = (
            <i
                className="fa fa-fw fa-pencil text-edit"
                style={styles.text_edit}
                onClick={(evt) => {
                    props.onEdit && props.onEdit(eventInfo(evt));
                }}
            >
            </i>
        )
    } else if (props.editable === false) {
        editIcn = (
            <i className="fa fa-fw" style={styles.text_edit}></i>
        )
    }
    let onDrag = undefined;
    let draggable = false;
    if (props.onDrag) { // Enable drag
        onDrag = (e) => {
            const [type, value, text] = props.onDrag(e);
            if (type && value) { // Start drag
                e.dataTransfer.setData('text/plain', text || value);
                e.dataTransfer.setData(type, value);
            };
        };
        draggable = true;
    };
    return (
        <div style={_l(_st)} title={props.title || val} className="text-wrap" onClick={(evt) => {
            if (props.onClick) props.onClick(eventInfo(evt));
        }}>
            <span
                className="text"
                draggable={draggable}
                onDragStart={onDrag}
            >
                {val}
            </span>
            {editIcn}
            <span>{sfx}</span>
        </div>
    );
}

class DnD extends React.Component {

    constructor(props) {
        super(props);
        this.dropCount = 0;
        this.dropTypes = [];
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragFinish = this.onDragFinish.bind(this);
        this.onDragOver = this.onDragOver.bind(this);
        this.onDrop = this.onDrop.bind(this);
    }

    hasData(e) {
        for (let type of e.dataTransfer.types) {
            if (this.dropTypes.includes(type)) { // OK
                return type;
            };
        }
        return undefined;
    }

    onDragStart(e) {
        if (!this.hasData(e)) return;
        this.dropCount += 1;
        if (this.dropCount == 1) { // First
            this.setState({
                dragTarget: true,
            });
        };
        e.preventDefault();
    }

    onDragOver(e) {
        if (!this.hasData(e)) return;
        e.preventDefault();
    }

    onDragFinish(e) {
        if (!this.hasData(e)) return;
        this.dropCount -= 1;
        if (this.dropCount == 0) { // Last
            this.setState({
                dragTarget: false,
            });
        };
        e.preventDefault();
    }

    onDrop(e) {
        const type = this.hasData(e);
        if (!type) return;
        this.dropCount = 0;
        this.setState({
            dragTarget: false,
        });
        this.onDropHandler(type, e.dataTransfer.getData(type), e);
        e.preventDefault();
    }

    onDropHandler(type, data) {
    }

}

/*
class TaskTag extends DnD {

    constructor(props) {
        super(props);
        this.dropTypes.push('tw/tag');
        this.state = {};
    }

    onDropHandler(type, data) {
        this.props.onDrop(type, data);
    }

    render() {
        const {item} = this.props;
        const {dragTarget} = this.state;
        return (
        );
    }

}
*/

class Task extends DnD {

    constructor(props) {
        super(props);
        this.dropTypes.push('tw/tag', 'tw/project', 'tw/task');
        this.state = {
            dependsVisible: false,
        };
    }

    onDropHandler(type, data) {
        this.props.onDrop(type, data);
    }

    toggleDepends() {
        this.setState({
            dependsVisible: !this.state.dependsVisible,
        });
    }

    render() {
        const {
            cols,
            task,
            style,
            running,
            onDone,
            onClick,
            onDelete,
            onAnnDelete,
            onDepDelete,
            onAnnAdd,
            onStartStop,
            onTap,
        } = this.props;
        const {dragTarget, dependsVisible} = this.state;
        let desc_field = 'description'
        const fields = cols.map((item, idx) => {
            if (item.field == 'description') { // Separator
                desc_field = item.full;
                return (<div key={idx} style={_l(styles.spacer)}></div>);
            }
            const val = task[`${item.full}_`] || '';
            const editable = task[`${item.field}_ro`]? false: true;
            const onFieldClick = (e) => {
                if (item.field == 'depends' && task.dependsList) { // Toggle
                    this.toggleDepends();
                };
            };
            return (
                <Text
                    editable={editable}
                    width={item.width}
                    title={task[`${item.field}_title`]}
                    key={idx}
                    onEdit={(e) => {
                        e.field = item.field;
                        const edit_val = task[`${item.field}_edit`] || '';
                        onClick(e, edit_val);
                    }}
                    onClick={onFieldClick}
                >
                    {val}
                </Text>
            );
        });
        let descSt = [styles.description, styles.flex1];
        if (task.description_truncate) {
            descSt.push(styles.oneLine);
        }
        let desc_count = null;
        if (task.description_count) {
            desc_count = (<Text style={[styles.description]}>{task.description_count}</Text>)
        }
        let depends = null;
        if (dependsVisible && task.dependsTasks) { // Render tasks
            depends = task.dependsTasks.map((item) => {
                return (
                    <div style={_l(styles.hflex, styles.annotation_line)} key={item.id}>
                        <Text
                            title={item.description}
                            style={[styles.flex1, styles.description, styles.textSmall, styles.oneLine]}
                            >
                            {`${item.id} ${item.description}`}
                        </Text>
                        <IconMenu style={style}>
                            <IconBtn
                                icon="close"
                                onClick={(e) => {
                                    onDepDelete(item.uuid, e);
                                }}
                                title="Remove dependency"
                            />
                        </IconMenu>
                    </div>
                );
            });
        };
        let annotations = null;
        if (task.description_ann) { // Have list
            annotations = task.description_ann.map((item, idx) => {
                return (
                    <div style={_l(styles.hflex, styles.annotation_line)} key={idx}>
                        <Text
                            title={item.title}
                            style={[styles.flex1, styles.description, styles.textSmall]}
                            >
                            {item.text}
                        </Text>
                        <IconMenu style={style}>
                            <IconBtn
                                icon="close"
                                onClick={(e) => {
                                    onAnnDelete(item.origin, e);
                                }}
                                title="Remove annotation"
                            />
                        </IconMenu>
                    </div>
                );
            });
        };
        let check_icon = 'square-o';
        if (task.status == 'completed') {
            check_icon = 'check-square-o';
        }
        if (task.status == 'deleted') {
            check_icon = 'close';
        }
        if (task.status == 'waiting') {
            check_icon = 'clock-o';
        }
        if (task.status == 'recurring') {
            check_icon = 'refresh';
        }
        let taskStyles = [styles.one_task];
        if (dragTarget) { // As target
           taskStyles.push(styles.task_drop);
        };
        taskStyles = taskStyles.concat(style);
        return (
            <div
                style={_l(taskStyles)}
                onClick={(e) => {
                    onTap(eventInfo(e));
                }}
                onDragEnter={this.onDragStart}
                onDragLeave={this.onDragFinish}
                onDragOver={this.onDragOver}
                onDrop={this.onDrop}
            >
                <div style={_l(styles.hflex)}>
                    <IconBtn
                        icon={check_icon}
                        onClick={onDone}
                    />
                    <Text
                        editable
                        style={descSt}
                        onDrag={(e) => {
                            return ['tw/task', task.uuid, task.description];
                        }}
                        onEdit={(e) => {
                            onClick(e, task.description);
                        }}
                    >
                        {task[`${desc_field}_`]}
                    </Text>
                    {desc_count}
                    <IconMenu style={style}>
                        <IconBtn
                            icon="close"
                            onClick={(e) => {
                                onDelete(e);
                            }}
                            title="Delete task"
                        />
                        <IconBtn
                            icon="plus"
                            onClick={(e) => {
                                onAnnAdd(e);
                            }}
                            title="Add annotation"
                        />
                        <IconBtn
                            icon={running? 'stop': 'play'}
                            onClick={(e) => {
                                onStartStop(e);
                            }}
                            title={running? "Stop task": "Start task"}
                        />
                    </IconMenu>
                </div>
                <div style={_l(styles.hflex, styles.wflex)}>
                    {fields}
                </div>
                {depends}
                {annotations}
            </div>
        );
    }
}

export class AppCmp extends React.Component {

    render() {
        return (
            <div style={_l([styles.vproxy, styles.max, styles.app])}>
                {this.props.children}
            </div>
        );
    }
};

export class ToolbarCmp extends React.Component {

    render() {
        const {
            onCommand,
            onTogglePane,
            onSync,
            onUndo
        } = this.props;
        return (
            <div style={_l([styles.flex0, styles.toolbar, styles.hflex])}>
                <div style={_l([styles.flex0, styles.hbar])}>
                    <IconBtn
                        icon="navicon"
                        title="Toggle Projects and Tags pane"
                        onClick={(e) => {
                            onTogglePane('navigation', e);
                        }}
                    />
                </div>
                <div style={_l([styles.flex1, styles.hbar])}>
                </div>
                <div style={_l([styles.flex0, styles.hbar])}>
                    <IconBtn
                        icon="terminal"
                        title="Run custom task command"
                        onClick={onCommand}
                    />
                    <IconBtn
                        icon="undo"
                        title="Undo latest operation"
                        onClick={onUndo}
                    />
                    <IconBtn
                        icon="cloud"
                        title="Sync with taskd server"
                        onClick={onSync}
                    />
                    <IconBtn
                        icon="navicon"
                        title="Toggle Reports and Contexts pane"
                        onClick={(e) => {
                            onTogglePane('reports', e);
                        }}
                    />
                </div>
            </div>
        );
    }
};

export class CenterCmp extends React.Component {

    render() {
        return (
            <div style={_l([styles.hproxy, styles.center])}>
                {this.props.children}
            </div>
        );
    }
};

class ProjectsNavigation extends React.Component {

    render() {
        const {projects, info} = this.props;
        if (!projects.length || (projects.length == 1 && projects[0].project == '')) {
            // No projects
            return null;
        }
        let hilites = {};
        if (info && info.tasks) { // Have something
            info.tasks.forEach((item) => {
                if (item.project) {
                    const val = hilites[item.project] || 0;
                    hilites[item.project] = val+1;
                }
            });
        };
        const renderProjects = (arr) => {
            return arr.map((item, idx) => {
                item.hilite = hilites[item.project];
                item.index = idx;
                return item;
            }).sort((a, b) => {
                if (!a.project && b.project) return -1;
                if (!b.project && a.project) return  1;
                if (a.hilite && !b.hilite) return -1;
                if (!a.hilite && b.hilite) return 1;
                return a.index-b.index;
            }).map((item, idx) => {
                let prefix = '';
                for (var i = 0; i < item.indent; i++) {
                    prefix += ' ';
                }
                let st = [styles.one_nav, styles.hflex, styles.hbar];
                if (item.hilite) st.push(styles.hilite);
                const jsx = (
                    <div
                        key={item.project}
                        style={_l(st)}
                        onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', `pro:${item.project}`);
                            e.dataTransfer.setData('tw/project', item.project);
                        }}
                        draggable
                        onClick={(e) => {
                            this.props.onClick(item, e);
                        }}
                    >
                        <Text style={[styles.flex1]}>{prefix+item.name}</Text>
                        <Text style={[styles.flex0]}>{item.count}</Text>
                    </div>
                );
                return [jsx, renderProjects(item.children)];
            });
        };
        return (
            <div style={_l(styles.vproxy)}>
                <div style={_l(styles.flex0, styles.hflex, styles.hbar)}>
                    <Text style={[styles.flex1]}>Projects</Text>
                    <IconBtn
                        icon="refresh"
                        title="Refresh list"
                        onClick={this.props.onRefresh}
                    />
                </div>
                <div style={_l(styles.flex1s)}>
                    {renderProjects(projects)}
                </div>
            </div>
        );
    }
}

class TagsNavigation extends React.Component {

    render() {
        const {info, tags} = this.props;
        if (!tags.length) {
            return null; // Hide
        }
        let hilites = {};
        if (info && info.tasks) { // Have something
            info.tasks.forEach((item) => {
                if (item.tags) {
                    item.tags.forEach((tag) => {
                        const val = hilites[tag] || 0;
                        hilites[tag] = val+1;
                    })
                }
            });
        };
        const list = tags.map((item, idx) => {
            item.hilite = hilites[item.name];
            item.index = idx;
            return item;
        }).sort((a, b) => {
            if (a.hilite && !b.hilite) return -1;
            if (!a.hilite && b.hilite) return 1;
            return a.index-b.index;
        }).map((item, idx) => {
            let st = [styles.one_nav, styles.hflex, styles.hbar];
            if (item.hilite) st.push(styles.hilite);
            return (
                <div
                    key={item.name}
                    style={_l(st)}
                    onClick={(e) => {
                        this.props.onClick(item, e);
                    }}
                    onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', `+${item.name}`);
                        e.dataTransfer.setData('tw/tag', item.name);
                    }}
                    draggable
                >
                    <Text style={[styles.flex1]}>{item.name}</Text>
                    <Text style={[styles.flex0]}>{item.count}</Text>
                </div>
            );
        });
        return (
            <div style={_l(styles.vproxy)}>
                <div style={_l(styles.flex0, styles.hflex, styles.hbar)}>
                    <Text style={[styles.flex1]}>Tags</Text>
                    <IconBtn
                        icon="refresh"
                        onClick={this.props.onRefresh}
                        title="Refresh list"
                    />
                </div>
                <div style={_l(styles.flex1s)}>
                    {list}
                </div>
            </div>
        );
    }
}

class PaneCmp extends React.Component {

    constructor(props, name) {
        super(props);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.name = name;
    }

    onMouseLeave(e) {
        const {mode, onHide} = this.props;
        if (mode == 'float') {
            onHide(this.name);
        };
    }
}

export class NavigationCmp extends PaneCmp {

    constructor(props) {
        super(props, 'navigation');
    }

    render() {
        let st = [styles.navigation, styles.vflex];
        if (this.props.mode == 'dock') {
            st.push(styles.flex0);
        }
        if (this.props.mode == 'float') {
            st.push(styles.navigationFloat);
        }
        if (this.props.mode == 'hidden') {
            st.push(styles.none);
        }
        return (
            <div style={_l(st)} onMouseLeave={this.onMouseLeave}>
                <ProjectsNavigation
                    onRefresh={this.props.onRefreshProjects}
                    onClick={this.props.onProjectClick}
                    projects={this.props.projects || []}
                    info={this.props.info}
                />
                <TagsNavigation
                    onRefresh={this.props.onRefreshTags}
                    onClick={this.props.onTagClick}
                    tags={this.props.tags || []}
                    info={this.props.info}
                />
            </div>
        );
    }
};

const ReportsList = React.createClass({
    render() {
        const reports = this.props.reports.map((item, idx) => {
            const onClick = () => {
                this.props.onClick(item);
            };
            return (
                <div
                    style={_l(styles.one_nav)}
                    key={idx}
                    onClick={onClick}
                >
                    <Text style={[styles.oneLine]}>{item.name}</Text>
                    <Text style={[styles.oneLine, styles.textSmall]}>{item.title}</Text>
                </div>
            )
        });
        return (
            <div style={_l(styles.vproxy)}>
                <div style={_l(styles.flex0, styles.hflex, styles.hbar)}>
                    <Text style={[styles.flex1]}>Reports</Text>
                    <IconBtn
                        icon="refresh"
                        onClick={this.props.onRefresh}
                        title="Refresh list"
                    />
                </div>
                <div style={_l(styles.flex1s)}>
                    {reports}
                </div>
            </div>
        );
    },
});

const ContextsList = React.createClass({
    render() {
        const {contexts, onRefresh, onClick} = this.props;
        if (!contexts) {
            return null; // Hide
        }
        const list = contexts.map((item, idx) => {
            const click = () => {
                onClick(item.context);
            };
            return (
                <div
                    style={_l(styles.one_nav, item.selected? styles.hilite: null)}
                    key={idx}
                    onClick={click}
                >
                    <Text style={[styles.oneLine]}>{item.name}</Text>
                    <Text style={[styles.oneLine, styles.textSmall]}>{item.filter}</Text>
                </div>
            )
        });
        return (
            <div style={_l(styles.flex0, styles.vflex)}>
                <div style={_l(styles.flex0, styles.hflex, styles.hbar)}>
                    <Text style={[styles.flex1]}>Contexts</Text>
                    <IconBtn
                        icon="refresh"
                        onClick={onRefresh}
                        title="Refresh list"
                    />
                </div>
                {list}
            </div>
        );
    },
});

export class ReportsCmp extends PaneCmp {

    constructor(props) {
        super(props, 'reports');
    }

    render() {
        const {reports, onReportsRefresh, onReportClick} = this.props;
        const {contexts, onContextsRefresh, onContextClick} = this.props;
        let st = [styles.reports, styles.vflex];
        if (this.props.mode == 'dock') {
            st.push(styles.flex0);
        }
        if (this.props.mode == 'float') {
            st.push(styles.reportsFloat);
        }
        if (this.props.mode == 'hidden') {
            st.push(styles.none);
        }
        return (
            <div style={_l(st)} onMouseLeave={this.onMouseLeave}>
                <ReportsList
                    reports={reports}
                    onRefresh={onReportsRefresh}
                    onClick={onReportClick}
                />
                <ContextsList
                    contexts={contexts}
                    onRefresh={onContextsRefresh}
                    onClick={onContextClick}
                />
            </div>
        );
    }
};

class PopupEditor extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            input: props.input || '',
        };
    }

    reset() {
        this.setState({
            input: this.props.input,
        });
    }

    onChange(evt) {
        this.setState({
            input: evt.target.value,
        });
    }

    finish(success, e) {
        const input = this.state.input.trim();
        if (success)
            this.props.onDone(input, e);
        else
            this.props.onCancel(input, e);
    }

    onKey(evt) {
        const e = eventInfo(evt);
        if (e.key == 13) { // Enter
            this.finish(true, e);
        }
        if (e.key == 27) { // Escape
            this.finish(false, e);
        }
    }

    componentDidMount() {
        this.refs.input.focus();
    }

    render() {
        return (
            <div style={_l(styles.floatCenter)}>
                <div style={_l(styles.input_box)}>
                    <div style={_l(styles.hflex, styles.hbar, styles.wflex)}>
                        <Text>{this.props.title}</Text>
                        <input
                            style={_l(styles.inp, styles.flex1)}
                            type="search"
                            value={this.state.input}
                            onChange={this.onChange.bind(this)}
                            onKeyDown={this.onKey.bind(this)}
                            ref="input"
                        />
                    </div>
                    <div style={_l(styles.hflex)}>
                        <div style={_l(styles.spacer)}></div>
                        <IconBtn icon="check" onClick={(e) => {
                            this.finish(true, e);
                        }}/>
                        <IconBtn icon="close" onClick={(e) => {
                            this.finish(false, e);
                        }}/>
                    </div>
                </div>
            </div>
        );
    }

}

export class MainCmp extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
        };
    }

    showInput(title, input, context) {
        this.setState({
            input: {
                title, input, context,
            },
        });
    }

    onInputCancel() {
        this.setState({
            input: undefined,
        });
    }

    async onInputDone(input, e) {
        const keepOpen = e.ctrl;
        const success = await this.props.onInput(input, this.state.input.context);
        if (success) { // Close
            if (keepOpen) { // Reset
                this.refs.popup_input.reset();
                return;
            };
            this.setState({
                input: undefined,
            });
        };
    }

    render() {
        const {pages, pins, page, onNavigation} = this.props;
        const {input} = this.state;
        const pageCmps = pages.map((pageCmp, idx) => {
            if (pageCmp.key == page) { // Visible
                return (<div key={pageCmp.key} style={_l(styles.vproxy)}>{pageCmp.cmp}</div>);
            } else { // Hidden
                return (<div key={pageCmp.key} style={_l(styles.none)}>{pageCmp.cmp}</div>);
            };
        });
        const pinsCmps = pins.map((pageCmp, idx) => {
            return (<div key={pageCmp.key} style={_l(styles.vproxy)}>{pageCmp.cmp}</div>);
        });
        const pageIndicators = pages.map((pageCmp, idx) => {
            const icn = pageCmp.key == page? 'circle': 'circle-o';
            return (<i key={idx} className={`fa fa-fw fa-${icn}`}></i>);
        });
        let inputCmp = null;
        if (input) { // Render
            inputCmp = (
                <PopupEditor
                    input={input.input}
                    title={input.title}
                    onDone={this.onInputDone.bind(this)}
                    onCancel={this.onInputCancel.bind(this)}
                    ref="popup_input"
                />
            );
        };
        return (
            <div style={_l(styles.vproxy, styles.tasks)}>
                <div style={_l(styles.flex1, styles.hflex)}>
                    <div style={_l(styles.vproxy)}>
                        {pageCmps}
                    </div>
                    {pinsCmps}
                </div>
                <div style={_l(styles.flex0, styles.hflex, styles.hbar)}>
                    <div style={_l(styles.flex0, styles.hbar)}>
                        <IconBtn icon="chevron-left" onClick={() => {
                            onNavigation(-1);
                        }}/>
                    </div>
                    <div style={_l(styles.flex1, styles.textCenter, styles.textSmall)}>
                        {pageIndicators}
                    </div>
                    <div style={_l(styles.flex0, styles.hbar)}>
                        <IconBtn icon="chevron-right" onClick={() => {
                            onNavigation(1);
                        }}/>
                    </div>
                </div>
                {inputCmp}
            </div>
        );
    }
};

class TaskPageInput extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            report: props.report || '',
            filter: props.filter || '',
        };
        this.onSearch = this.onSearch.bind(this);
    }

    onReportChange (evt) {
        this.setState({
            report: evt.target.value,
        });
    }

    onFilterChange (evt) {
        this.setState({
            filter: evt.target.value,
        });
    }

    componentDidMount() {
        this.refs.filter.addEventListener('search', this.onSearch);
    }

    componentWillUnmount() {
        this.refs.filter.removeEventListener('search', this.onSearch);
    }

    render() {
        const {onPin} = this.props;
        const line1 = (
            <div style={_l(styles.flex0, styles.hflex, styles.wflex)}>
                <input
                    style={_l(styles.inp, styles.flex1)}
                    type="text"
                    value={this.state.report}
                    onChange={this.onReportChange.bind(this)}
                    onKeyPress={this.onKey.bind(this)}
                    placeholder="Report"
                />
                <IconBtn
                    icon="plus"
                    onClick={this.props.onAdd}
                    title="Add new"
                />
                <IconBtn icon="refresh" onClick={this.props.onRefresh}/>
                <IconBtn
                    icon="thumb-tack"
                    onClick={onPin}
                    title="Pin/unpin panel"
                />
                <IconBtn icon="close" onClick={this.props.onClose}/>
            </div>
        );
        const line2 = (
            <div style={_l(styles.flex0, styles.hflex)}>
                <input
                    style={_l(styles.inp, styles.flex1)}
                    type="search"
                    ref="filter"
                    value={this.state.filter}
                    onChange={this.onFilterChange.bind(this)}
                    onKeyPress={this.onKey.bind(this)}
                    onSearch={this.onSearch.bind(this)}
                    placeholder="Filter"
                />
            </div>
        );

        return (
            <div style={_l(styles.flex0)}>
                {line1}
                {line2}
            </div>
        );
    }

    input() {
        return this.state;
    }

    onSearch(evt) {
        if (!this.state.filter) { // Empty
            this.props.onRefresh();
        };
    }

    onKey(evt) {
        if (evt.charCode == 13) {
            // Refresh
            this.props.onRefresh();
        }
    }

    filter(filter) {
        this.state.filter = filter;
        this.setState({
            filter: filter,
        });
    }

}

class CmdPageInput extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            cmd: props.cmd || '',
        };
    }

    onChange (evt) {
        this.setState({
            cmd: evt.target.value,
        });
    }

    componentDidMount() {
        this.refs.input.focus();
    }

    render() {
        const {onRefresh, onPin, onClose} = this.props;
        const line1 = (
            <div style={_l(styles.flex0, styles.hflex, styles.wflex)}>
                <input
                    style={_l(styles.inp, styles.flex1)}
                    type="text"
                    ref="input"
                    value={this.state.cmd}
                    onChange={this.onChange.bind(this)}
                    onKeyPress={this.onKey.bind(this)}
                    placeholder="Command"
                />
                <IconBtn icon="refresh" onClick={onRefresh}/>
                <IconBtn
                    icon="thumb-tack"
                    onClick={onPin}
                    title="Pin/unpin panel"
                />
                <IconBtn icon="close" onClick={onClose}/>
            </div>
        );
        return (
            <div style={_l(styles.flex0)}>
                {line1}
            </div>
        );
    }

    input() {
        return this.state;
    }

    onKey(evt) {
        if (evt.charCode == 13) {
            // Refresh
            this.props.onRefresh();
        }
    }

}

export class TaskPageCmp extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
        };
    }


    input() {
        return this.refs.input.input();
    }

    filter(filter) {
        this.refs.input.filter(filter);
    }

    render() {
        const {
            info,
            selection,
            onEdit,
            onSelect,
            onAdd,
        } = this.props;
        let body = null;
        if (info) {
            // Render header
            const cols = info.cols.filter((item) => {
                return item.visible;
            });
            const header_items = cols.map((item, idx) => {
                if (item.field == 'description') {
                    // Insert spacer
                    return (<div key={idx} style={_l(styles.spacer)}></div>);
                }
                return (<Text editable={false} width={item.width} key={idx}>{item.label}</Text>);
            });
            const tasks = info.tasks.map((item, idx) => {
                const running = item.start? true: false;
                const onDone = (e) => {
                    this.props.onDone(item);
                };
                const onAnnAdd = (e) => {
                    onEdit(item, 'annotate', '');
                };
                const onDelete = (e) => {
                    onEdit(item, 'delete', '', true);
                };
                const onAnnDelete = (text, e) => {
                    onEdit(item, 'denotate', text, true);
                };
                const onClick = (e, data, cmd='modify') => {
                    if (e.meta) {
                        let addCmd = data;
                        if (e.field == 'id') {
                            addCmd = `depends:${item.id || item.uuid}`;
                        }
                        onAdd(e, addCmd);
                        e.stop();
                        return;
                    }
                    onEdit(item, cmd, data);
                };
                const onTap = (e) => {
                    if (e.meta) {
                        onSelect(item);
                    }
                };
                const onDepDelete = (uuid, e) => {
                    let uuids = item.depends || [];
                    const dep = uuids.map((u) => u != uuid? u: `-${u}`).join(',')
                    onEdit(item, 'modify', `depends:${dep}`, true);
                };
                const onDrop = (type, data) => {
                    if (type == 'tw/tag') { // Drop tag - add tag
                        onEdit(item, 'modify', `+${data}`, true);
                    };
                    if (type == 'tw/project') { // Drop project - set project
                        onEdit(item, 'modify', `pro:${data}`, true);
                    };
                    if (type == 'tw/task') { // Drop task - add dependency
                        let uuids = item.depends || [];
                        if (uuids.includes(data) || item.uuid == data) { // Already or invalid
                            return;
                        };
                        uuids.push(data);
                        onEdit(item, 'modify', `depends:${uuids.join(',')}`, true);
                    };
                };
                let style = [styles.one_item];
                if (item.styles) { // Append
                    style.push.apply(style, item.styles);
                };
                if (selection[item.uuid]) {
                    style.push(styles.task_selected);
                }
                return (
                    <Task
                        task={item}
                        running={running}
                        style={style}
                        key={idx}
                        cols={cols}
                        onDone={onDone}
                        onClick={onClick}
                        onDelete={onDelete}
                        onAnnDelete={onAnnDelete}
                        onAnnAdd={onAnnAdd}
                        onTap={onTap}
                        onStartStop={(e) => {
                            onEdit(item, running? 'stop': 'start', '', true);
                        }}
                        onDrop={onDrop}
                        onDepDelete={onDepDelete}
                    />
                );
            });
            // Render tasks
            body = (
                <div style={_l(styles.vproxy)}>
                    <div style={_l(styles.flex0, styles.hflex, styles.wflex)}>{header_items}</div>
                    <div style={_l(styles.flex1s)}>{tasks}</div>
                </div>
            );
        }
        return (
            <div style={_l(styles.vproxy)}>
                <TaskPageInput
                    {...this.props}
                    ref="input"
                />
                <div style={_l(styles.vproxy)}>
                    {body}
                </div>
            </div>
        );
    }
}

export class CmdPageCmp extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
        };
    }


    input() {
        return this.refs.input.input();
    }

    filter(filter) {
        this.refs.input.filter(filter);
    }

    render() {
        const {
            info,
        } = this.props;
        let body = null;
        if (info) {
            const lines = info.lines.map((line, idx) => {
                return (
                    <Text
                        key={idx}
                        style={[styles.pre, styles[`cmdLine_${line.type}`]]}
                    >
                        {line.line}
                    </Text>
                );
            })
            body = (
                <div style={_l(styles.vproxy, styles.relative)}>
                    <div style={_l(styles.cmdPane)}>{lines}</div>
                </div>
            );
        }
        return (
            <div style={_l(styles.vproxy)}>
                <CmdPageInput
                    {...this.props}
                    ref="input"
                />
                <div style={_l(styles.vproxy)}>
                    {body}
                </div>
            </div>
        );
    }
}

export class StatusbarCmp extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            message: '',
            floats: [],
        };
    }

    hideFloat(fl) {
        this.state.floats.forEach((item, idx) => {
            if (item == fl) { // OK
                this.state.floats.splice(idx, 1);
                this.setState({
                    floats: this.state.floats,
                });
            };
        });
    }

    showMessage(type, message, choices, resp) {
        if (!message) {
            return false;
        }
        if (type == 'question') {
            const fl = {
                type: type,
                message: message,
                choices: choices,
                resp: resp,
            };
            this.state.floats.push(fl);
            this.setState({
                floats: this.state.floats,
            });
            return;
        }
        this.setState({
            type: type,
            message: message,
            time: new Date(),
        });
        if (type == 'error') { // Add float
            const fl = {
                type: type,
                message: message,
            };
            this.state.floats.push(fl);
            this.setState({
                floats: this.state.floats,
            });
            setTimeout(() => {
                this.hideFloat(fl);
            }, 2000);
        };
    }

    render() {
        const {spin} = this.props;
        let spinCls = 'fa fa-fw fa-cloud';
        if (spin) spinCls += ' fa-spin';
        const floats = this.state.floats.map((item, idx) => {
            if (item.type == 'question') {
                const btns = item.choices.map((btn) => {
                    return (
                        <a
                            key={btn}
                            href="#"
                            style={_l(styles.btn_a)}
                            onClick={(e) => {
                                this.hideFloat(item);
                                item.resp(btn);
                            }}
                        >
                            {btn}
                        </a>
                    );
                });
                return (
                    <div key={idx} style={_l(styles.floatBlock)}>
                        <Text>{item.message}</Text>
                        <div style={_l(styles.hflex)}>
                            <div style={_l(styles.spacer)}></div>
                            {btns}
                        </div>
                    </div>
                );
            }
            return (
                <div key={idx} style={_l(styles.floatBlock)} onClick={() => {
                    this.hideFloat(item);
                }}>
                    <Text>{item.message}</Text>
                </div>
            );
        });
        let time = null;
        if (this.state.time) {
            time = (
                <Text style={[styles.oneLine, styles.flex0, styles.textSmall]}>
                    {this.state.time.toLocaleTimeString()}:
                </Text>
            );
        }
        return (
            <div style={_l(styles.flex0, styles.hflex, styles.hbar, styles.statusbar)}>
                <div style={_l(styles.floatBR)}>
                    {floats}
                </div>
                <div style={_l(styles.flex0, spin? null: styles.hidden)}>
                    <i className={spinCls}></i>
                </div>
                {time}
                <Text
                    style={[styles.oneLine, styles.flex1, styles.textSmall]}
                >
                    {this.state.message}
                </Text>
            </div>
        );
    }
}
