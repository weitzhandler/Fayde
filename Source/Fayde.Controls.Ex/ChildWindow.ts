module Fayde.Controls {
    export class ChildWindow extends ContentControl {
        static HasCloseButtonProperty = DependencyProperty.Register("HasCloseButton", () => Boolean, ChildWindow, true, (d, args) => (<ChildWindow>d).OnHasCloseButtonChanged(args));
        HasCloseButton: boolean;
        private OnHasCloseButtonChanged(args: DependencyPropertyChangedEventArgs) {
            if (!this._CloseButton)
                return;
            this._CloseButton.Visibility = args.NewValue === true ? Visibility.Visible : Visibility.Collapsed;
        }

        static OverlayBrushProperty = DependencyProperty.Register("OverlayBrush", () => Media.Brush, ChildWindow, undefined, (d, args) => (<ChildWindow>d).OnOverlayBrushChanged(args));
        OverlayBrush: Media.Brush;
        private OnOverlayBrushChanged(args: DependencyPropertyChangedEventArgs) {
            if (!this._Overlay)
                return;
            this._Overlay.Background = <Media.Brush>args.NewValue;
        }

        static OverlayOpacityProperty = DependencyProperty.Register("OverlayOpacity", () => Number, ChildWindow, undefined, (d, args) => (<ChildWindow>d).OnOverlayOpacityChanged(args));
        OverlayOpacity: number;
        private OnOverlayOpacityChanged(args: DependencyPropertyChangedEventArgs) {
            if (!this._Overlay)
                return;
            this._Overlay.Opacity = <number>args.NewValue;
        }

        static TitleProperty = DependencyProperty.Register("Title", () => Object, ChildWindow);
        Title: any;

        Closed = new MulticastEvent<EventArgs>();
        Closing = new MulticastEvent<CancelEventArgs>();

        private static _OpenWindowCount = 0;
        private static _PrevEnabledState = true;

        private _CloseButton: Primitives.ButtonBase = null;
        private _ContentRoot: FrameworkElement = null;
        private _Chrome: FrameworkElement = null;
        private _Overlay: Panel = null;
        private _ContentPresenter: ContentPresenter = null;
        private _Opened: Media.Animation.Storyboard = null;
        private _Closed: Media.Animation.Storyboard = null;
        private _ChildWindowPopup: Primitives.Popup = null;
        private _Root: FrameworkElement = null;
        private _IsMouseCaptured = false;
        private _ClickPoint: Point = null;
        private _WindowPosition: Point = null;
        private _ContentRootTransform: Media.TranslateTransform = null;
        private _DesiredContentWidth: number = 0;
        private _DesiredContentHeight: number = 0;
        private _DesiredMargin: Thickness = null;
        private _IsClosing = false;
        private _IsOpen = false;
        private get IsOpen(): boolean { return this._ChildWindowPopup && !!this._ChildWindowPopup.IsOpen; }
        private _DialogResult: boolean = null;
        get DialogResult(): boolean { return this._DialogResult; }
        set DialogResult(value: boolean) {
            value = Fayde.ConvertAnyToType(value, Boolean);
            if (this._DialogResult === value)
                return;
            this._DialogResult = value;
            this.Close();
        }

        constructor() {
            super();
            this.DefaultStyleKey = (<any>this).constructor;
        }

        OnApplyTemplate() {
            this.UnsubscribeTemplateEvents();

            super.OnApplyTemplate();

            this._CloseButton = <Primitives.ButtonBase>this.GetTemplateChild("CloseButton", Primitives.ButtonBase);
            if (this._CloseButton)
                this._CloseButton.Visibility = this.HasCloseButton === true ? Visibility.Visible : Visibility.Collapsed;
            this._ContentRoot = <FrameworkElement>this.GetTemplateChild("ContentRoot", FrameworkElement);
            this._Chrome = <FrameworkElement>this.GetTemplateChild("Chrome", FrameworkElement);
            this._Overlay = <Panel>this.GetTemplateChild("Overlay", Panel);
            this._ContentPresenter = <ContentPresenter>this.GetTemplateChild("ContentPresenter", ContentPresenter);
            this._Root = <FrameworkElement>this.GetTemplateChild("Root", FrameworkElement);
            this.FindStoryboards();
            this.SubscribeTemplateEvents();
            this.SubscribeStoryboardEvents();
            this._DesiredMargin = this.Margin;
            this.Margin = new Thickness();
            if (!this.IsOpen)
                return;
            this._DesiredContentHeight = this.Height;
            this._DesiredContentWidth = this.Width;
            this.UpdateOverlaySize();
            this.UpdateRenderTransform();

            this.UpdateVisualState();
        }
        private FindStoryboards() {
            if (this._Closed != null)
                this._Closed.Completed.Unsubscribe(this.Closing_Completed, this);
            if (this._Opened != null)
                this._Opened.Completed.Unsubscribe(this.Opening_Completed, this);

            if (!this._Root)
                return;
            var groups = Media.VSM.VisualStateManager.GetVisualStateGroups(this._Root);
            if (!groups)
                return;

            var group: Media.VSM.VisualStateGroup;
            var enumerator = groups.GetEnumerator();
            while (enumerator.MoveNext() && !group) {
                if (enumerator.Current.Name === "WindowStates")
                    group = enumerator.Current;
            }

            var enumerator2 = group.States.GetEnumerator();
            while (enumerator2.MoveNext()) {
                if (enumerator2.Current.Name === "Closed")
                    this._Closed = enumerator2.Current.Storyboard;
                else if (enumerator2.Current.Name === "Opened")
                    this._Opened = enumerator2.Current.Storyboard;
            }
        }
        GoToStates(gotoFunc: (state: string) => boolean) {
            if (this._IsClosing)
                gotoFunc("Closed");
            else
                gotoFunc("Opened");
        }

        private SubscribeEvents() {
            var app = Application.Current;
            if (app)
                app.Resized.Subscribe(this.Page_Resized, this);
            this.KeyDown.Subscribe(this.ChildWindow_KeyDown, this);
            this.LostFocus.Subscribe(this.ChildWindow_LostFocus, this);
            this.SizeChanged.Subscribe(this.ChildWindow_SizeChanged, this);
        }
        private UnsubscribeEvents() {
            var app = Application.Current;
            if (app)
                app.Resized.Unsubscribe(this.Page_Resized, this);
            this.KeyDown.Unsubscribe(this.ChildWindow_KeyDown, this);
            this.LostFocus.Unsubscribe(this.ChildWindow_LostFocus, this);
            this.SizeChanged.Unsubscribe(this.ChildWindow_SizeChanged, this);
        }
        private SubscribeStoryboardEvents() {
            if (this._Closed != null)
                this._Closed.Completed.Subscribe(this.Closing_Completed, this);
            if (this._Opened)
                this._Opened.Completed.Subscribe(this.Opening_Completed, this);
        }
        private SubscribeTemplateEvents() {
            if (this._CloseButton != null)
                this._CloseButton.Click.Subscribe(this.CloseButton_Click, this);
            if (this._Chrome != null) {
                this._Chrome.MouseLeftButtonDown.Subscribe(this.Chrome_MouseLeftButtonDown, this);
                this._Chrome.MouseLeftButtonUp.Subscribe(this.Chrome_MouseLeftButtonUp, this);
                this._Chrome.MouseMove.Subscribe(this.Chrome_MouseMove, this);
            }
            if (this._ContentPresenter)
                this._ContentPresenter.SizeChanged.Subscribe(this.ContentPresenter_SizeChanged, this);
        }
        private UnsubscribeTemplateEvents() {
            if (this._CloseButton != null)
                this._CloseButton.Click.Unsubscribe(this.CloseButton_Click, this);
            if (this._Chrome != null) {
                this._Chrome.MouseLeftButtonDown.Unsubscribe(this.Chrome_MouseLeftButtonDown, this);
                this._Chrome.MouseLeftButtonUp.Unsubscribe(this.Chrome_MouseLeftButtonUp, this);
                this._Chrome.MouseMove.Unsubscribe(this.Chrome_MouseMove, this);
            }
            if (this._ContentPresenter)
                this._ContentPresenter.SizeChanged.Unsubscribe(this.ContentPresenter_SizeChanged, this);
        }

        private Closing_Completed(sender: any, e: EventArgs) {
            if (this._ChildWindowPopup)
                this._ChildWindowPopup.IsOpen = false;
            if (this._Closed)
                this._Closed.Completed.Unsubscribe(this.Closing_Completed, this);
        }
        private Opening_Completed(sender: any, e: EventArgs) {
            if (this._Opened)
                this._Opened.Completed.Unsubscribe(this.Opening_Completed, this);
            this._IsOpen = true;
            this.OnOpened();
        }
        OnOpened() {
            this.UpdatePosition();
            if (this._Overlay) {
                this._Overlay.Opacity = this.OverlayOpacity;
                this._Overlay.Background = this.OverlayBrush;
            }
            if (this.Focus())
                return;
            this.IsTabStop = true;
            this.Focus();
        }
        private CloseButton_Click(sender: any, e: RoutedEventArgs) {
            this.Close();
        }

        Show() {
            this.SubscribeEvents();
            this.SubscribeTemplateEvents();
            this.SubscribeStoryboardEvents();
            if (!this._ChildWindowPopup) {
                this._ChildWindowPopup = new Primitives.Popup();
                try {
                    this._ChildWindowPopup.Child = this;
                } catch (err) {
                    throw new InvalidOperationException("Could not attach ChildWindow.");
                }
            }
            this.MaxHeight = Number.POSITIVE_INFINITY;
            this.MaxWidth = Number.POSITIVE_INFINITY;
            this.OnWindowShowing();
            if (this._ChildWindowPopup != null && Application.Current.RootVisual != null) {
                this._ChildWindowPopup.IsOpen = true;
                this._DialogResult = null;
            }
            if (!this._ContentRoot)
                return;
            this.UpdateVisualState();
        }
        private OnWindowShowing() {
            if (!Application.Current)
                return;
            var rv = <Control>Application.Current.RootVisual;
            if (!(rv instanceof Control))
                return;
            if (this.IsOpen)
                return;
            if (this._Opened && this._IsOpen)
                return;
            if (ChildWindow._OpenWindowCount === 0)
                ChildWindow._PrevEnabledState = rv.IsEnabled;
            ++ChildWindow._OpenWindowCount;
            rv.IsEnabled = false;
        }
        Close() {
            var e = new CancelEventArgs();
            this.Closing.Raise(this, e);
            if (e.Cancel) {
                this._DialogResult = null;
                return;
            }

            this.OnWindowClosing();
            if (!this.IsOpen)
                return;
            if (this._Closed != null) {
                this._IsClosing = true;
                try {
                    this.UpdateVisualState();
                } finally {
                    this._IsClosing = false;
                }
            }
            else
                this._ChildWindowPopup.IsOpen = false;
            if (this._DialogResult == null)
                this._DialogResult = false;
            this.Closed.Raise(this, EventArgs.Empty);
            this._IsOpen = false;
            this.UnsubscribeEvents();
            this.UnsubscribeTemplateEvents();
            if (!Application.Current.RootVisual)
                return;
            Application.Current.RootVisual.GotFocus.Unsubscribe(this.RootVisual_GotFocus, this);
        }
        private OnWindowClosing() {
            if (!Application.Current)
                return;
            var rv = <Control>Application.Current.RootVisual;
            if (!(rv instanceof Control))
                return;
            if (!this.IsOpen)
                return;
            if (this._Opened && !this._IsOpen)
                return;
            --ChildWindow._OpenWindowCount;
            if (ChildWindow._OpenWindowCount === 0)
                rv.IsEnabled = ChildWindow._PrevEnabledState;
        }

        private Chrome_MouseLeftButtonDown(sender: any, e: Input.MouseButtonEventArgs) {
            if (!this._Chrome)
                return;
            e.Handled = true;
            if (this._CloseButton != null && !this._CloseButton.IsTabStop) {
                this._CloseButton.IsTabStop = true;
                try {
                    this.Focus();
                }
                finally {
                    this._CloseButton.IsTabStop = false;
                }
            } else
                this.Focus();
            this._Chrome.CaptureMouse();
            this._IsMouseCaptured = true;
            this._ClickPoint = e.GetPosition(sender instanceof UIElement ? sender : null);
        }
        private Chrome_MouseLeftButtonUp(sender: any, e: Input.MouseButtonEventArgs) {
            if (!this._Chrome)
                return;
            e.Handled = true;
            this._Chrome.ReleaseMouseCapture();
            this._IsMouseCaptured = false;
        }
        private Chrome_MouseMove(sender: any, e: Input.MouseEventArgs) {
            if (!this._IsMouseCaptured || !this._ContentRoot || (!Application.Current || !Application.Current.RootVisual))
                return;
            var p2 = e.GetPosition(Application.Current.RootVisual);
            var generalTransform = this._ContentRoot.TransformToVisual(Application.Current.RootVisual);
            if (!generalTransform)
                return;
            var p1 = generalTransform.Transform(this._ClickPoint);
            this._WindowPosition = generalTransform.Transform(new Point(0.0, 0.0));
            if (p2.X < 0.0)
                p2 = new Point(0.0, findPositionY(p1, p2, 0.0));
            if (p2.X > this.Width)
                p2 = new Point(this.Width, findPositionY(p1, p2, this.Width));
            if (p2.Y < 0.0)
                p2 = new Point(findPositionX(p1, p2, 0.0), 0.0);
            if (p2.Y > this.Height)
                p2 = new Point(findPositionX(p1, p2, this.Height), this.Height);
            var X = p2.X - p1.X;
            var Y = p2.Y - p1.Y;
            var fe = <FrameworkElement>Application.Current.RootVisual;
            if (!(fe instanceof FrameworkElement) && fe.FlowDirection === FlowDirection.RightToLeft)
                X = -X;
            this.UpdateContentRootTransform(X, Y);
        }
        private ContentPresenter_SizeChanged(sender: any) {
            if (this._ContentRoot != null && Application.Current != null && (Application.Current.RootVisual != null && this._IsOpen)) {
                var generalTransform = this._ContentRoot.TransformToVisual(Application.Current.RootVisual);
                if (generalTransform != null) {
                    var point = generalTransform.Transform(new Point(0.0, 0.0));
                    this.UpdateContentRootTransform(this._WindowPosition.X - point.X, this._WindowPosition.Y - point.Y);
                }
            }
            var rectangleGeometry = new Media.RectangleGeometry();
            var r = new rect();
            rect.set(r, 0.0, 0.0, this._ContentPresenter.ActualWidth, this._ContentPresenter.ActualHeight);
            rectangleGeometry.Rect = r;
            this._ContentPresenter.Clip = rectangleGeometry;
            this.UpdatePosition();
        }
        private Page_Resized(sender: any, e: EventArgs) {
            if (this._ChildWindowPopup)
                this.UpdateOverlaySize();
        }
        private RootVisual_GotFocus(sender: any, e: RoutedEventArgs) {
            this.Focus();
        }
        private ChildWindow_SizeChanged(sender: any, e: SizeChangedEventArgs) {
            if (this._Overlay) {
                if (e.NewSize.Height !== this._Overlay.ActualHeight)
                    this._DesiredContentHeight = e.NewSize.Height;
                if (e.NewSize.Width !== this._Overlay.ActualWidth)
                    this._DesiredContentWidth = e.NewSize.Width;
            }
            if (!this.IsOpen)
                return;
            this.UpdateOverlaySize();
        }
        private ChildWindow_KeyDown(sender: any, e: Input.KeyEventArgs) {
            if (!e || e.Handled || !(e.Key === Input.Key.F4 && Input.Keyboard.HasControl()) || !Input.Keyboard.HasShift())
                return;
            var childWindow = <ChildWindow>sender;
            if (!(childWindow instanceof ChildWindow))
                return;
            childWindow.Close();
            e.Handled = true;
        }
        private ChildWindow_LostFocus(sender: any, e: RoutedEventArgs) {
            if (!this.IsOpen)
                return;
            var app = Application.Current;
            if (!app || !app.RootVisual)
                return;
            app.RootVisual.GotFocus.Subscribe(this.RootVisual_GotFocus, this);
        }

        private UpdateOverlaySize() {
            if (!this._Overlay)
                return;
            var app = Application.Current;
            if (!app)
                return;
            var extents = app.MainSurface.Extents;
            this.Height = extents.Height;
            this.Width = extents.Width;
            /*
            if (host.Settings.EnableAutoZoom) {
                var zoomFactor = host.Content.ZoomFactor;
                if (zoomFactor != 0.0) {
                    this.Height = this.Height / zoomFactor;
                    this.Width = this.Width / zoomFactor;
                }
            }
            */
            this._Overlay.Height = this.Height;
            this._Overlay.Width = this.Width;
            if (!this._ContentRoot)
                return;
            this._ContentRoot.Width = this._DesiredContentWidth;
            this._ContentRoot.Height = this._DesiredContentHeight;
            this._ContentRoot.Margin = this._DesiredMargin;
        }
        private UpdatePosition() {
            if (!this._ContentRoot || !Application.Current || !Application.Current.RootVisual)
                return;
            var generalTransform = this._ContentRoot.TransformToVisual(Application.Current.RootVisual);
            if (generalTransform)
                this._WindowPosition = generalTransform.Transform(new Point(0.0, 0.0));
        }
        private UpdateRenderTransform() {
            if (!this._Root || !this._ContentRoot)
                return;
            var generalTransform = this._Root.TransformToVisual(null);
            if (!generalTransform)
                return;
            //var zoom = 1.0 / (Application.Current.Host.Settings.EnableAutoZoom ? Application.Current.Host.Content.ZoomFactor : 1.0);
            var zoom = 1.0;
            var point1 = new Point(zoom, 0.0);
            var point2 = new Point(0.0, zoom);
            var point3 = generalTransform.Transform(point1);
            var point4 = generalTransform.Transform(point2);

            var mat1 = Media.Matrix.Identity;
            mat1.M11 = point3.X;
            mat1.M12 = point3.Y;
            mat1.M21 = point4.X;
            mat1.M22 = point4.Y;
            var xform1 = new Media.MatrixTransform();
            xform1.Matrix = mat1;

            var inverse = xform1.Inverse;
            var xform2 = inverse || xform1.Clone();

            var tg1 = <Media.TransformGroup>this._ContentRoot.RenderTransform;
            if (tg1 instanceof Media.TransformGroup)
                tg1.Children.Add(xform1);
            else
                this._ContentRoot.RenderTransform = xform1;

            var tg2 = <Media.TransformGroup>this._Root.RenderTransform;
            if (tg2 instanceof Media.TransformGroup)
                tg2.Children.Add(xform2);
            else
                this._Root.RenderTransform = xform2;
        }
        private UpdateContentRootTransform(x: number, y: number) {
            if (!this._ContentRootTransform) {
                this._ContentRootTransform = new Media.TranslateTransform();
                this._ContentRootTransform.X = x;
                this._ContentRootTransform.Y = y;
                var tg = <Media.TransformGroup>this._ContentRoot.RenderTransform;
                if (!(tg instanceof Media.TransformGroup)) {
                    tg = new Media.TransformGroup();
                    tg.Children.Add(this._ContentRoot.RenderTransform);
                }
                tg.Children.Add(this._ContentRootTransform);
                this._ContentRoot.RenderTransform = tg;
            } else {
                this._ContentRootTransform.X += x;
                this._ContentRootTransform.Y += y;
            }
        }
    }

    function findPositionX(p1: Point, p2: Point, y: number): number {
        if (y === p1.Y || p1.X === p2.X)
            return p2.X;
        return (y - p1.Y) * (p1.X - p2.X) / (p1.Y - p2.Y) + p1.X;
    }
    function findPositionY(p1: Point, p2: Point, x: number): number {
        if (p1.Y === p2.Y || x === p1.X)
            return p2.Y;
        return (p1.Y - p2.Y) * (x - p1.X) / (p1.X - p2.X) + p1.Y;
    }
}