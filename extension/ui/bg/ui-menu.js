/*
 * Copyright 2018 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 * 
 * This file is part of SingleFile.
 *
 *   SingleFile is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU Lesser General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   SingleFile is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU Lesser General Public License for more details.
 *
 *   You should have received a copy of the GNU Lesser General Public License
 *   along with SingleFile.  If not, see <http://www.gnu.org/licenses/>.
 */

/* global browser, singlefile */

singlefile.ui.menu = (() => {

	const BROWSER_MENUS_API_SUPPORTED = browser.menus && browser.menus.onClicked && browser.menus.create && browser.menus.update && browser.menus.removeAll;
	const MENU_ID_SAVE_PAGE = "save-page";
	const MENU_ID_SELECT_PROFILE = "select-profile";
	const MENU_ID_SELECT_PROFILE_PREFIX = "select-profile-";
	const MENU_ID_SAVE_SELECTED = "save-selected";
	const MENU_ID_SAVE_FRAME = "save-frame";
	const MENU_ID_SAVE_SELECTED_TABS = "save-selected-tabs";
	const MENU_ID_SAVE_UNPINNED_TABS = "save-unpinned-tabs";
	const MENU_ID_SAVE_ALL_TABS = "save-tabs";
	const MENU_ID_AUTO_SAVE = "auto-save";
	const MENU_ID_AUTO_SAVE_DISABLED = "auto-save-disabled";
	const MENU_ID_AUTO_SAVE_TAB = "auto-save-tab";
	const MENU_ID_AUTO_SAVE_UNPINNED = "auto-save-unpinned";
	const MENU_ID_AUTO_SAVE_ALL = "auto-save-all";

	initialize();
	browser.tabs.onActivated.addListener(async activeInfo => {
		const tab = await browser.tabs.get(activeInfo.tabId);
		await refreshTab(tab);
	});
	browser.tabs.onCreated.addListener(refreshTab);
	return {
		refresh
	};

	async function refresh(tab) {
		const [profiles, tabsData] = await Promise.all([singlefile.config.getProfiles(), singlefile.tabsData.get()]);
		const options = await singlefile.config.getOptions(tabsData.profileName, tab && tab.url, true);
		if (BROWSER_MENUS_API_SUPPORTED) {
			const pageContextsEnabled = ["page", "frame", "image", "link", "video", "audio"];
			const defaultContextsDisabled = ["browser_action"];
			const defaultContextsEnabled = defaultContextsDisabled.concat(...pageContextsEnabled);
			const defaultContexts = options.contextMenuEnabled ? defaultContextsEnabled : defaultContextsDisabled;
			await browser.menus.removeAll();
			if (options.contextMenuEnabled) {
				browser.menus.create({
					id: MENU_ID_SAVE_PAGE,
					contexts: pageContextsEnabled,
					title: browser.i18n.getMessage("menuSavePage")
				});
			}
			if (options.contextMenuEnabled) {
				browser.menus.create({
					id: "separator-1",
					contexts: pageContextsEnabled,
					type: "separator"
				});
			}
			browser.menus.create({
				id: MENU_ID_SAVE_SELECTED,
				contexts: defaultContexts,
				title: browser.i18n.getMessage("menuSaveSelection")
			});
			if (options.contextMenuEnabled) {
				browser.menus.create({
					id: MENU_ID_SAVE_FRAME,
					contexts: ["frame"],
					title: browser.i18n.getMessage("menuSaveFrame")
				});
				browser.menus.create({
					id: MENU_ID_SAVE_SELECTED_TABS,
					contexts: pageContextsEnabled,
					title: browser.i18n.getMessage("menuSaveSelectedTabs")
				});
			}
			browser.menus.create({
				id: MENU_ID_SAVE_UNPINNED_TABS,
				contexts: defaultContexts,
				title: browser.i18n.getMessage("menuUnpinnedTabs")
			});
			browser.menus.create({
				id: MENU_ID_SAVE_ALL_TABS,
				contexts: defaultContexts,
				title: browser.i18n.getMessage("menuAllTabs")
			});
			if (options.contextMenuEnabled) {
				browser.menus.create({
					id: "separator-2",
					contexts: pageContextsEnabled,
					type: "separator"
				});
			}
			if (Object.keys(profiles).length > 1) {
				browser.menus.create({
					id: MENU_ID_SELECT_PROFILE,
					title: browser.i18n.getMessage("menuSelectProfile"),
					contexts: defaultContexts,
				});
				browser.menus.create({
					id: MENU_ID_SELECT_PROFILE_PREFIX + "default",
					type: "radio",
					contexts: defaultContexts,
					title: browser.i18n.getMessage("profileDefaultSettings"),
					checked: !tabsData.profileName || tabsData.profileName == singlefile.config.DEFAULT_PROFILE_NAME,
					parentId: MENU_ID_SELECT_PROFILE
				});
				Object.keys(profiles).forEach((profileName, profileIndex) => {
					if (profileName != singlefile.config.DEFAULT_PROFILE_NAME) {
						browser.menus.create({
							id: MENU_ID_SELECT_PROFILE_PREFIX + profileIndex,
							type: "radio",
							contexts: defaultContexts,
							title: profileName,
							checked: tabsData.profileName == profileName,
							parentId: MENU_ID_SELECT_PROFILE
						});
					}
				});
			}
			browser.menus.create({
				id: MENU_ID_AUTO_SAVE,
				contexts: defaultContexts,
				title: browser.i18n.getMessage("menuAutoSave")
			});
			browser.menus.create({
				id: MENU_ID_AUTO_SAVE_DISABLED,
				type: "radio",
				title: browser.i18n.getMessage("menuAutoSaveDisabled"),
				contexts: defaultContexts,
				checked: true,
				parentId: MENU_ID_AUTO_SAVE
			});
			browser.menus.create({
				id: MENU_ID_AUTO_SAVE_TAB,
				type: "radio",
				title: browser.i18n.getMessage("menuAutoSaveTab"),
				contexts: defaultContexts,
				checked: false,
				parentId: MENU_ID_AUTO_SAVE
			});
			browser.menus.create({
				id: MENU_ID_AUTO_SAVE_UNPINNED,
				type: "radio",
				title: browser.i18n.getMessage("menuAutoSaveUnpinnedTabs"),
				contexts: defaultContexts,
				checked: false,
				parentId: MENU_ID_AUTO_SAVE
			});
			browser.menus.create({
				id: MENU_ID_AUTO_SAVE_ALL,
				type: "radio",
				title: browser.i18n.getMessage("menuAutoSaveAllTabs"),
				contexts: defaultContexts,
				checked: false,
				parentId: MENU_ID_AUTO_SAVE
			});
		}
	}

	async function initialize() {
		if (BROWSER_MENUS_API_SUPPORTED) {
			refresh();
			browser.menus.onClicked.addListener(async (event, tab) => {
				if (event.menuItemId == MENU_ID_SAVE_PAGE) {
					singlefile.ui.saveTab(tab);
				}
				if (event.menuItemId == MENU_ID_SAVE_SELECTED) {
					singlefile.ui.saveTab(tab, { selected: true });
				}
				if (event.menuItemId == MENU_ID_SAVE_FRAME) {
					singlefile.ui.saveTab(tab, { frameId: event.frameId });
				}
				if (event.menuItemId == MENU_ID_SAVE_SELECTED_TABS) {
					const tabs = await browser.tabs.query({ currentWindow: true, highlighted: true });
					tabs.forEach(tab => singlefile.ui.isAllowedURL(tab.url) && singlefile.ui.saveTab(tab));
				}
				if (event.menuItemId == MENU_ID_SAVE_UNPINNED_TABS) {
					const tabs = await browser.tabs.query({ currentWindow: true, pinned: false });
					tabs.forEach(tab => singlefile.ui.isAllowedURL(tab.url) && singlefile.ui.saveTab(tab));
				}
				if (event.menuItemId == MENU_ID_SAVE_ALL_TABS) {
					const tabs = await browser.tabs.query({ currentWindow: true });
					tabs.forEach(tab => singlefile.ui.isAllowedURL(tab.url) && singlefile.ui.saveTab(tab));
				}
				if (event.menuItemId == MENU_ID_AUTO_SAVE_TAB) {
					const tabsData = await singlefile.tabsData.get();
					if (!tabsData[tab.id]) {
						tabsData[tab.id] = {};
					}
					tabsData[tab.id].autoSave = event.checked;
					await singlefile.tabsData.set(tabsData);
					refreshExternalComponents(tab.id, { autoSave: true });
				}
				if (event.menuItemId == MENU_ID_AUTO_SAVE_DISABLED) {
					const tabsData = await singlefile.tabsData.get();
					Object.keys(tabsData).forEach(tabId => tabsData[tabId].autoSave = false);
					tabsData.autoSaveUnpinned = tabsData.autoSaveAll = false;
					await singlefile.tabsData.set(tabsData);
					refreshExternalComponents(tab.id, { autoSave: false });
				}
				if (event.menuItemId == MENU_ID_AUTO_SAVE_ALL) {
					const tabsData = await singlefile.tabsData.get();
					tabsData.autoSaveAll = event.checked;
					await singlefile.tabsData.set(tabsData);
					refreshExternalComponents(tab.id, { autoSave: true });
				}
				if (event.menuItemId == MENU_ID_AUTO_SAVE_UNPINNED) {
					const tabsData = await singlefile.tabsData.get();
					tabsData.autoSaveUnpinned = event.checked;
					await singlefile.tabsData.set(tabsData);
					refreshExternalComponents(tab.id, { autoSave: true });
				}
				if (event.menuItemId.startsWith(MENU_ID_SELECT_PROFILE_PREFIX)) {
					const [profiles, tabsData] = await Promise.all([singlefile.config.getProfiles(), singlefile.tabsData.get()]);
					const profileId = event.menuItemId.split(MENU_ID_SELECT_PROFILE_PREFIX)[1];
					if (profileId == "default") {
						tabsData.profileName = singlefile.config.DEFAULT_PROFILE_NAME;
					} else {
						const profileIndex = Number(profileId);
						tabsData.profileName = Object.keys(profiles)[profileIndex];
					}
					await singlefile.tabsData.set(tabsData);
					refresh();
					refreshExternalComponents(tab.id, { autoSave: tabsData.autoSaveAll || tabsData.autoSaveUnpinned || (tabsData[tab.id] && tabsData[tab.id].autoSave) });
				}
			});
			const tabs = await browser.tabs.query({});
			tabs.forEach(tab => refreshTab(tab));
		}
	}

	async function refreshExternalComponents(tabId) {
		await singlefile.autosave.refresh();
		singlefile.ui.button.refresh(tabId);
	}

	async function refreshTab(tab) {
		const tabsData = await singlefile.tabsData.get();
		if (BROWSER_MENUS_API_SUPPORTED) {
			try {
				const disabled = Boolean(!tabsData[tab.id] || !tabsData[tab.id].autoSave);
				await browser.menus.update(MENU_ID_AUTO_SAVE_DISABLED, { checked: disabled });
				await browser.menus.update(MENU_ID_AUTO_SAVE_TAB, { checked: !disabled });
				await browser.menus.update(MENU_ID_AUTO_SAVE_UNPINNED, { checked: Boolean(tabsData.autoSaveUnpinned) });
				await browser.menus.update(MENU_ID_AUTO_SAVE_ALL, { checked: Boolean(tabsData.autoSaveAll) });
			} catch (error) {
				/* ignored */
			}
		}
	}

})();