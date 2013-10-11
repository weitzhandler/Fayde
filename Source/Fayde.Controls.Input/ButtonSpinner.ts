/// <reference path="Fayde.d.ts" />
/// <reference path="Spinner.ts" />
/// CODE
/// <reference path="InteractionHelper.ts" />

module Fayde.Controls.Input {
    export class ButtonSpinner extends Spinner {
        private IsPressed: boolean = false;

        private _IncreaseButton: Controls.Primitives.ButtonBase;
        private _DecreaseButton: Controls.Primitives.ButtonBase;
        private _Interaction: InteractionHelper;

        static ContentProperty = DependencyProperty.Register("Content", () => Object, ButtonSpinner, undefined, (d, args) => (<ButtonSpinner>d).OnContentChanged(args.OldValue, args.NewValue));
        Content: any;
        OnContentChanged(oldValue: any, newValue: any) { }

        OnValidSpinDirectionChanged(args: IDependencyPropertyChangedEventArgs) {
            super.OnValidSpinDirectionChanged(args);
            this.SetButtonUsage();
        }

        constructor() {
            super();
            this.DefaultStyleKey = (<any>this).constructor;
            this._Interaction = new InteractionHelper(this);
        }

        OnApplyTemplate() {
            super.OnApplyTemplate();
            this.SetIncreaseButton(this.GetTemplateChild("IncreaseButton"));
            this.SetDecreaseButton(this.GetTemplateChild("DecreaseButton"));
            this.UpdateVisualState(false);
            this.SetButtonUsage();
        }

        GetVisualStateCommon(): string { return this._Interaction.GetVisualStateCommon(); }
        
        OnMouseEnter(e: Fayde.Input.MouseEventArgs) {
            if (!this._Interaction.AllowMouseEnter(e))
                return;
            this.UpdateVisualState(true);
            super.OnMouseEnter(e);
        }
        OnMouseLeave(e: Fayde.Input.MouseEventArgs) {
            if (!this._Interaction.AllowMouseLeave(e))
                return;
            this.UpdateVisualState(true);
            super.OnMouseLeave(e);
        }
        OnMouseLeftButtonDown(e: Fayde.Input.MouseButtonEventArgs) {
            if (!this._Interaction.AllowMouseLeftButtonDown(e))
                return;
            this.UpdateVisualState(true);
            super.OnMouseLeftButtonDown(e);
        }
        OnMouseLeftButtonUp(e: Fayde.Input.MouseButtonEventArgs) {
            super.OnMouseLeftButtonUp(e);
            var position: Point;
            var ib = this._IncreaseButton;
            if (ib && !ib.IsEnabled) {
                position = e.GetPosition(ib);
                if (position.X > 0.0 && position.X < ib.ActualWidth && position.Y > 0.0 && position.Y < ib.ActualHeight)
                    e.Handled = true;
            }
            var db = this._DecreaseButton;
            if (db || db.IsEnabled)
                return;
            position = e.GetPosition(db);
            if (position.X > 0.0 && position.X < db.ActualWidth && position.Y > 0.0 && position.Y < db.ActualHeight)
                e.Handled = true;
        }
        OnGotFocus(e: RoutedEventArgs) {
            if (!this._Interaction.AllowGotFocus(e))
                return;
            this.UpdateVisualState(true);
            super.OnGotFocus(e);
        }
        OnLostFocus(e: RoutedEventArgs) {
            if (!this._Interaction.AllowLostFocus(e))
                return;
            this._Interaction.OnLostFocusBase();
            super.OnLostFocus(e);
        }

        private SetIncreaseButton(d: DependencyObject) {
            if (this._IncreaseButton)
                this._IncreaseButton.Click.Unsubscribe(this.Button_Click, this);

            if (d instanceof Controls.Primitives.ButtonBase)
                this._IncreaseButton = <Controls.Primitives.ButtonBase>d;
            else
                this._IncreaseButton = null;
            if (this._IncreaseButton)
                this._IncreaseButton.Click.Subscribe(this.Button_Click, this);
        }
        private SetDecreaseButton(d: DependencyObject) {
            if (this._DecreaseButton)
                this._DecreaseButton.Click.Unsubscribe(this.Button_Click, this);

            if (d instanceof Controls.Primitives.ButtonBase)
                this._DecreaseButton = <Controls.Primitives.ButtonBase>d;
            else
                this._DecreaseButton = null;
            if (this._DecreaseButton)
                this._DecreaseButton.Click.Subscribe(this.Button_Click, this);
        }
        private Button_Click(sender: any, e: Fayde.Input.MouseButtonEventArgs) {
            this.OnSpin(new SpinEventArgs(sender === this._IncreaseButton ? SpinDirection.Increase : SpinDirection.Decrease));
        }

        private SetButtonUsage() {
            if (this._IncreaseButton)
                this._IncreaseButton.IsEnabled = (this.ValidSpinDirection & ValidSpinDirections.Increase) === ValidSpinDirections.Increase;
            if (this._DecreaseButton)
                this._DecreaseButton.IsEnabled = (this.ValidSpinDirection & ValidSpinDirections.Decrease) === ValidSpinDirections.Decrease;
        }
    }
    Fayde.RegisterType(ButtonSpinner, {
        Name: "ButtonSpinner",
        Namespace: "Fayde.Controls.Input",
        XmlNamespace: "http://schemas.wsick.com/fayde/input"
    });
}