/* eslint-disable @typescript-eslint/no-empty-interface */
//
// Internal types
// These are types used between components that are not extensible
//

export interface ILoopBoxProvision {
    id: string;
    systemName: string;
    claimToken: string;
}

//
// Public types
// These are types used by developers to extend the system via plugs and other extensibility points
//

export interface IChaosExperiment {
    id: string;
    active: boolean;
    name: string;
    subtitle: string;
    description: string;
}


export enum EnumLoopBoxUserRole {
    Admin = 'loopbox.userrole.admin',
    User = 'loopbox.userrole.user'
}

export interface ILoopBoxUser {
    id: string;
    authProviderId: string;
    displayName: string;
    email: string;
    mobilePhone: string;
    location: {
        city: string;
        state: string;
    };
    role: EnumLoopBoxUserRole;
}

export interface ILoopBoxRegistration {
    systemName: string;
    systemId: string;
    ownerId: string;
}

export enum EnumLoopBoxDeviceCapability {
    SmartHome_Unassigned = 'smarthome.unassigned',
    SmartHome_Lighting_On = 'smarthome.lighting_on',
    SmartHome_Lighting_Off = 'smarthome.lighting_off',
    SmartHome_Lighting_Dim = 'smarthome.lighting_dim',
    SmartHome_Lighting_Scene = 'smarthome.lighting_scene',
    SmartHome_Media_Play = 'smarthome.media_play',
    SmartHome_Media_Pause = 'smarthome.media_pause',
    SmartHome_Media_Stop = 'smarthome.media_stop',
    SmartHome_Media_PreviousTrack = 'smarthome.media_previoustrack',
    SmartHome_Media_NextTrack = 'smarthome.media_nexttrack',
    SmartHome_Media_VolumeMute = 'smarthome.media_volumemute',
    SmartHome_Media_VolumeDown = 'smarthome.media_molumedown',
    SmartHome_Media_VolumeUp = 'smarthome.media_volumeup'
}

export interface ILoopBoxPluginCapability {
    type: string;
    options: string[];
}

export interface ILoopBoxPluginConfiguration {
    hookType: string;
    pluginName: string;
    linkHref: string;
    accountLinkProvider: string;
    header: string;
    description: string;
    completedDescription: string;
}

export interface ILoopBoxPlugin {
    id: string;
    name: string;
    description: string;
    version: string;
    updatedDate: string;
    configuration?: ILoopBoxPluginConfiguration;
}

export interface ILoopBoxNliProcessorPlugin extends ILoopBoxPlugin { }

export interface ILoopBoxDomainProcessorPlugin extends ILoopBoxPlugin { }

export interface ILoopBoxOutputAdapterPlugin extends ILoopBoxPlugin {
    capabilities?: ILoopBoxPluginCapability;
}

export interface ILoopBoxInputAdapterPlugin extends ILoopBoxPlugin { }

export const ZonePrefix = 'loopbox.zone';
export const CustomZonePrefix = 'loopbox.zone.custom';

export enum EnumLoopBoxZoneId {
    Unassigned = 'loopbox.zone.unassigned',
    Custom = 'loopbox.zone.custom',
    House = 'loopbox.zone.house',
    Outside = 'loopbox.zone.outside',
    Garage = 'loopbox.zone.garage',
    Front_Porch = 'loopbox.zone.frontporch',
    Back_Porch = 'loopbox.zone.backporch',
    Family_Room = 'loopbox.zone.familyroom',
    Patio = 'loopbox.zone.patio',
    Nook = 'loopbox.zone.nook',
    Kitchen = 'loopbox.zone.kitchen',
    Living_Room = 'loopbox.zone.livingroom',
    Dining_Room = 'loopbox.zone.diningroom',
    Office = 'loopbox.zone.office',
    Basement = 'loopbox.zone.basement',
    Media_Room = 'loopbox.zone.mediaroom',
    Mechanical_Room = 'loopbox.zone.mechanicalroom',
    Master_Bedroom = 'loopbox.zone.masterbedroom',
    Master_Bath = 'loopbox.zone.masterbath',
    Master_Closet = 'loopbox.zone.mastercloset',
    Master_Porch = 'loopbox.zone.masterporch',
    Utility_Room = 'loopbox.zone.utilityroom',
    Powder_Room = 'loopbox.zone.powderroom',
    Foyer = 'loopbox.zone.foyer',
    Guest_Room = 'loopbox.zone.guestroom',
    Upper_Hallway = 'loopbox.zone.upperhallway',
    Library = 'loopbox.zone.library',
    Landscape = 'loopbox.zone.landscape'
}

export interface ILoopBoxZone {
    name: string;
    zoneId: string;
    nlName: string;
}

export interface ILoopBoxDevice {
    name: string;
    deviceId: string;
    hostId: string;
    domain: string;
    zoneId: string;
    providerId: string;
    ipAddress: string;
    model: string;
    sceneType: string;
    data?: any;
    capabilities: string[];
    editContext: string;
}

export interface ILoopBoxScene { }

export interface ILoopBoxConfiguration {
    setupToken: string;
    hostName: string;
    registration: ILoopBoxRegistration;
    inputProcessors: ILoopBoxNliProcessorPlugin[];
    domainProcessors: ILoopBoxDomainProcessorPlugin[];
    outputAdapters: ILoopBoxOutputAdapterPlugin[];
    inputAdapters: ILoopBoxInputAdapterPlugin[];
    zones: ILoopBoxZone[];
    devices: ILoopBoxDevice[];
    scenes: ILoopBoxScene[];
    users: ILoopBoxUser[];
    // internal flags as needed e.g. deviceDiscoveryCompleted, editContext
    [key: string]: any;
}

//
// LoopBox configuration edit commands and options
//
export enum EnumLoopBoxConfigurationType {
    Registration = 'loopbox.configurationtype.registration',
    Zone = 'loopbox.configurationtype.zone',
    Device = 'loopbox.configurationtype.device',
    Upgrade = 'loopbox.configurationtype.upgrade'
}

export enum EnumLoopBoxConfigurationAction {
    Add = 'loopbox.configurationaction.add',
    Edit = 'loopbox.configurationaction.edit',
    Assign = 'loopbox.configurationaction.assign',
    Delete = 'loopbox.configurationaction.delete'
}

export interface ILoopBoxConfigurationOptions {
    type: string;
    action: EnumLoopBoxConfigurationAction;
    data: any;
}

export interface IInputAdapterManager {
    scheme(instance: IInputAdapter): void;
}

export interface IOutputAdapterManager {
    domain(instance: IOutputAdapter): void;
}

export interface INliProcessorRequest {
    context: any;
    loopBoxIntent: ILoopBoxIntent;
}

export interface INliProcessorResponse {
    succeeded: boolean;
    processorId: string;
    payload: {
        action: string;
        domain: string;
        task: string;
        parameters: any;
        query: string;
    };
}

export interface INliProcessor {
    id: string;
    processInput(nliProcessorRequest: INliProcessorRequest): Promise<INliProcessorResponse>;
}

export interface IDomainProcessorRequest {
    context: any;
    loopBoxIntent: ILoopBoxIntent;
}

export interface IDomainProcessorResponse {
    succeeded: boolean;
    processorId: string;
    payload?: any;
}

export interface IDomainProcessor {
    id: string;
    domain: string;
    refineIntent(domainProcessorRequest: IDomainProcessorRequest): Promise<IDomainProcessorResponse>;
}

export interface ILoopBoxInputRequest {
    scheme?: string;
    requestId: string;
    processorId: string;
    userId: string;
    query: string;
    context?: any;
    customZones?: any;
}

export interface IInputAdapter {
    id: string;
    scheme: string;
    preAdapt(requestId: string, userId: string, inputAdapterRequest: any): Promise<ILoopBoxInputRequest>;
    postAdapt(processResponse: any, originalPayload: any): Promise<any>;
}
export interface IOutputAdapterResponse {
    succeeded: boolean;
    processorId: string;
    spoken: {
        speak: string;
    };
    text: {
        message: string;
    };
}

export interface IOutputAdapter {
    id: string;
    domain: string;
    discoverDevices(deviceDiscoveryMap: any): Promise<any>;
    execute(inputIntent: ILoopBoxIntent): Promise<IOutputAdapterResponse>;
}

export interface ILoopBoxIntent {
    succeeded: boolean;
    spoken: {
        speak: string;
    };
    text: {
        message: string;
    };
    inputAdapterRequest?: ILoopBoxInputRequest;
    nliProcessorResponse?: INliProcessorResponse;
    domainProcessorResponse?: IDomainProcessorResponse;
    outputAdapterResponses?: IOutputAdapterResponse[];
}
