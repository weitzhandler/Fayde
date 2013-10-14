/// <reference path="../../Core/DependencyObject.ts" />
/// <reference path="../../Core/XamlObjectCollection.ts" />
/// CODE
/// <reference path="VisualState.ts" />
/// <reference path="VisualTransition.ts" />
/// <reference path="../Animation/Storyboard.ts" />
/// <reference path="../../Controls/Control.ts" />

module Fayde.Media.VSM {
    export class VisualStateChangedEventArgs extends EventArgs {
        OldState: VisualState;
        NewState: VisualState;
        Control: Controls.Control;
        constructor(oldState: VisualState, newState: VisualState, control: Controls.Control) {
            super();
            Object.defineProperty(this, "OldState", { value: oldState, writable: false });
            Object.defineProperty(this, "NewState", { value: newState, writable: false });
            Object.defineProperty(this, "Control", { value: control, writable: false });
        }
    }

    export class VisualStateGroup extends DependencyObject {
        static StatesProperty = DependencyProperty.RegisterImmutable("States", () => VisualStateCollection, VisualStateGroup);
        States: VisualStateCollection;

        static TransitionsProperty = DependencyProperty.RegisterImmutable("Transitions", () => XamlObjectCollection, VisualStateGroup);
        Transitions: XamlObjectCollection<VisualTransition>;

        static Annotations = { ContentProperty: VisualStateGroup.StatesProperty };
        private _CurrentStoryboards: Animation.Storyboard[] = [];
        CurrentStateChanging: MulticastEvent<VisualStateChangedEventArgs> = new MulticastEvent<VisualStateChangedEventArgs>();
        CurrentStateChanged: MulticastEvent<VisualStateChangedEventArgs> = new MulticastEvent<VisualStateChangedEventArgs>();
        CurrentState: VisualState = null;

        constructor() {
            super();
            VisualStateGroup.StatesProperty.Initialize<VisualStateCollection>(this);
            VisualStateGroup.TransitionsProperty.Initialize<VisualTransition>(this);
        }

        GetState(stateName: string): VisualState {
            var enumerator = this.States.GetEnumerator();
            var state: VisualState;
            while (enumerator.MoveNext()) {
                state = enumerator.Current;
                if (state.Name === stateName)
                    return state;
            }
            return null;
        }

        StartNewThenStopOld(element: FrameworkElement, newStoryboards: Animation.Storyboard[]) {
            var i: number;
            var storyboard: Animation.Storyboard;
            var res = element.Resources;
            for (i = 0; i < newStoryboards.length; i++) {
                storyboard = newStoryboards[i];
                if (storyboard == null)
                    continue;
                res.Set((<any>storyboard)._ID, storyboard);
                try {
                    storyboard.Begin();
                } catch (err) {
                    //clear storyboards on error
                    for (var j = 0; j <= i; j++) {
                        if (newStoryboards[j] != null)
                            res.Set((<any>newStoryboards[j])._ID, undefined);
                    }
                    throw err;
                }
            }

            this.StopCurrentStoryboards(element);

            var curStoryboards = this._CurrentStoryboards;
            for (i = 0; i < newStoryboards.length; i++) {
                if (newStoryboards[i] == null)
                    continue;
                curStoryboards.push(newStoryboards[i]);
            }
        }
        StopCurrentStoryboards(element: FrameworkElement) {
            var curStoryboards = this._CurrentStoryboards;
            var enumerator = ArrayEx.GetEnumerator(curStoryboards);
            var storyboard: Animation.Storyboard;
            while (enumerator.MoveNext()) {
                storyboard = enumerator.Current;
                if (!storyboard)
                    continue;
                element.Resources.Set((<any>storyboard)._ID, undefined);
                storyboard.Stop();
            }
            this._CurrentStoryboards = [];
        }

        RaiseCurrentStateChanging(element: FrameworkElement, oldState: VisualState, newState: VisualState, control: Controls.Control) {
            this.CurrentStateChanging.Raise(this, new VisualStateChangedEventArgs(oldState, newState, control));
        }
        RaiseCurrentStateChanged(element: FrameworkElement, oldState: VisualState, newState: VisualState, control: Controls.Control) {
            this.CurrentStateChanged.Raise(this, new VisualStateChangedEventArgs(oldState, newState, control));
        }
    }
    Fayde.RegisterType(VisualStateGroup, {
    	Name: "VisualStateGroup",
    	Namespace: "Fayde.Media.VSM",
    	XmlNamespace: Fayde.XMLNS
    });

    export class VisualStateGroupCollection extends XamlObjectCollection<VisualStateGroup> {
    }
    Fayde.RegisterType(VisualStateGroupCollection, {
    	Name: "VisualStateGroupCollection",
    	Namespace: "Fayde.Media.VSM",
    	XmlNamespace: Fayde.XMLNS
    });
}